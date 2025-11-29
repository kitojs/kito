import { runBenchmark } from "./utils/http.ts";

import config, {
  type FrameworkRuntime
} from "./config.ts";
const { hostname, frameworks, chart } = config;

import { generateChart } from "./utils/chart.ts";
import { waitForServerReady } from "./utils/wait.ts";

import fs from "node:fs";
import { spawn, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";

type BenchmarkResult = {
  framework: string;
  result: {
    requests: { average: number };
    latency: { average: number };
    throughput: { average: number };
  };
};

type RunningBenchmark = {
  stop: () => Promise<void> | void;
};

type NormalizedFramework = {
  name: string;
  runtime: FrameworkRuntime;
};

const CURRENT_RUNTIME: FrameworkRuntime =
  typeof (globalThis as { Bun?: unknown }).Bun !== "undefined" ? "bun" : "node";

const PROJECT_ROOT = path.dirname(fileURLToPath(import.meta.url));
const RUNNER_ENTRY = path.join(PROJECT_ROOT, "utils", "frameworkRunner.ts");
const PNPM_BIN = process.platform === "win32" ? "pnpm.cmd" : "pnpm";


async function launchFramework(
  benchName: string,
  framework: NormalizedFramework,
  port: number,
): Promise<RunningBenchmark> {
  if (framework.runtime === CURRENT_RUNTIME) {
    const mod = await import(`./cases/${benchName}/${framework.name}.ts`);
    const bench = mod.default || mod;
    const instance: RunningBenchmark = bench.start(port);

    return {
      stop: async () => {
        if (typeof instance?.stop === "function") {
          await instance.stop();
        }
      },
    };
  }

  const child = spawnFrameworkProcess(
    framework.runtime,
    benchName,
    framework.name,
    port,
  );

  return {
    stop: async () => await stopChildProcess(child),
  };
}

function spawnFrameworkProcess(
  targetRuntime: FrameworkRuntime,
  benchName: string,
  frameworkName: string,
  port: number,
): ChildProcess {
  if (targetRuntime === "node") {
    return spawn(
      PNPM_BIN,
      ["dlx", "tsx", RUNNER_ENTRY, benchName, frameworkName, String(port)],
      {
        stdio: "inherit",
        cwd: PROJECT_ROOT,
      },
    );
  }

  return spawn(
    PNPM_BIN,
    ["dlx", "bun", "run", RUNNER_ENTRY, benchName, frameworkName, String(port)],
    {
      stdio: "inherit",
      cwd: PROJECT_ROOT,
    },
  );
}

async function stopChildProcess(child: ChildProcess): Promise<void> {
  if (!child.killed) {
    child.kill("SIGTERM");
  }

  await new Promise<void>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0 || signal === "SIGTERM") {
        resolve();
      } else {
        reject(
          new Error(`Framework runner exited with code ${code ?? "null"}`),
        );
      }
    });
  });
}

function getMachineSpecs() {
  const cpu = os.cpus()[0].model;
  const memory = `${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`;
  const platform = `${os.platform()} ${os.release()}`;

  return { cpu, memory, platform };
}

async function main() {
  const benchName = process.argv[2];
  if (!benchName) {
    console.error(
      "You must pass the name of the benchmark, e.g.: pnpm bench:run basic",
    );
    process.exit(1);
  }

  const args = process.argv.slice(3);
  const excludeRuntimes = args
    .find((arg) => arg.startsWith("--exclude-runtime="))
    ?.split("=")[1]
    ?.split(",") || [];

  const excludeFrameworks = args
    .find((arg) => arg.startsWith("--exclude-framework="))
    ?.split("=")[1]
    ?.split(",") || [];

  const runtimes: FrameworkRuntime[] = ["node", "bun"].filter(
    (r) => !excludeRuntimes.includes(r)
  ) as FrameworkRuntime[];

  const machine = getMachineSpecs();

  for (const runtime of runtimes) {
    console.log(`\n${"-".repeat(40)}`);
    console.log(`Running benchmarks on ${runtime.toUpperCase()} runtime`);
    console.log(`${"-".repeat(40)}\n`);

    const results: BenchmarkResult[] = [];
    let port = 3000;

    for (const frameworkName of frameworks) {
      if (excludeFrameworks.includes(frameworkName)) {
        console.log(`Skipping ${frameworkName} (excluded via flag)`);
        continue;
      }

      if (runtime === "bun" && frameworkName === "restify") {
        console.log(
          `Skipping ${frameworkName} (not compatible with Bun runtime)`,
        );

        continue;
      }

      const framework: NormalizedFramework = {
        name: frameworkName,
        runtime: runtime,
      };

      const benchInstance = await launchFramework(benchName, framework, port);
      await waitForServerReady(port);

      console.log(
        `Running benchmark for ${framework.name} (runtime: ${framework.runtime})...`,
      );
      const URL = `http://${hostname}:${port}`;

      const result = await runBenchmark(URL);
      results.push({ framework: framework.name, result });

      port++;

      await benchInstance.stop();
    }

    console.table(
      results.map(({ framework, result }) => ({
        Framework: framework,
        "Requests/sec": result.requests.average,
        "Latency (ms)": result.latency.average,
        "Throughput (bytes/sec)": result.throughput.average,
      })),
    );

    if (chart?.enabled) {
      const output =
        chart.output?.replace("result.png", `result-${runtime}.png`) ||
        `results/charts/result-${runtime}.png`;
      await generateChart(
        {
          frameworks: results.map((r) => r.framework),
          requests: results.map((r) => r.result.requests.average),
          latency: results.map((r) => r.result.latency.average),
          throughput: results.map((r) => r.result.throughput.average),
        },
        output,
        runtime,
      );
    }

    for (const result of results) {
      const OUTPUT_PATH = `results/data/${runtime}`;
      const FILE_PATH = `${OUTPUT_PATH}/${result.framework}.json`;

      let previousResults = null;
      let comparison = null;

      if (fs.existsSync(FILE_PATH)) {
        try {
          const content = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
          if (content.results) {
            previousResults = content.results;

            const calcDiff = (current: number, previous: number) => {
              const diff = ((current - previous) / previous) * 100;
              return `${diff > 0 ? "+" : ""}${diff.toFixed(2)}%`;
            };

            comparison = {
              requests: calcDiff(result.result.requests.average, previousResults.requests.average),
              latency: calcDiff(result.result.latency.average, previousResults.latency.average),
              throughput: calcDiff(result.result.throughput.average, previousResults.throughput.average),
            };
          }
        } catch (_) { }
      }

      const outputData = {
        machine,
        runtime,
        framework: result.framework,
        results: result.result,
        previousResults,
        comparison
      };

      const data = JSON.stringify(outputData, null, "\t");

      if (!fs.existsSync(OUTPUT_PATH)) {
        fs.mkdirSync(OUTPUT_PATH, { recursive: true });
      }

      fs.writeFileSync(FILE_PATH, data);
    }

    const sortedResults = [...results].sort(
      (a, b) => b.result.requests.average - a.result.requests.average
    );

    const winner = sortedResults[0];

    const ranking = sortedResults.map((item, index) => {
      const diff = ((item.result.requests.average - winner.result.requests.average) / winner.result.requests.average) * 100;

      return {
        rank: index + 1,
        framework: item.framework,
        requests: item.result.requests.average,
        latency: item.result.latency.average,
        throughput: item.result.throughput.average,
        difference: index === 0 ? "0%" : `${diff.toFixed(2)}%`
      };
    });

    const leaderboard = {
      winner: winner.framework,
      runtime,
      machine,
      ranking
    };

    fs.writeFileSync(
      `results/comparison-${runtime}.json`,
      JSON.stringify(leaderboard, null, "\t")
    );
  }

  console.log(`\n${"-".repeat(40)}`);
  console.log("✅ All benchmarks completed!");
  console.log(`${"-".repeat(40)}\n`);

  process.exit(0);
}

(async () => await main())();
