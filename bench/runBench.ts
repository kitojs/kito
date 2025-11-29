import { runBenchmark } from "./utils/http.ts";

import config, {
  type FrameworkConfig,
  type FrameworkRuntime,
} from "./config.ts";
const { hostname, frameworks, chart } = config;

import { generateChart } from "./utils/chart.ts";
import { waitForServerReady } from "./utils/wait.ts";

import fs from "node:fs";
import { spawn, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

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

function normalizeFramework(entry: FrameworkConfig): NormalizedFramework {
  if (typeof entry === "string") {
    return { name: entry, runtime: CURRENT_RUNTIME };
  }

  return {
    name: entry.name,
    runtime: entry.runtime ?? CURRENT_RUNTIME,
  };
}

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

async function main() {
  const benchName = process.argv[2];
  if (!benchName) {
    console.error(
      "You must pass the name of the benchmark, e.g.: pnpm bench:run basic",
    );
    process.exit(1);
  }

  const results: BenchmarkResult[] = [];
  let port = 3000;

  for (const entry of frameworks) {
    const framework = normalizeFramework(entry);
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
    const output = chart.output || "results/charts/result.png";
    await generateChart(
      {
        frameworks: results.map((r) => r.framework),
        requests: results.map((r) => r.result.requests.average),
        latency: results.map((r) => r.result.latency.average),
        throughput: results.map((r) => r.result.throughput.average),
      },
      output,
    );
  }

  for (const result of results) {
    const OUTPUT_PATH = "results/data";
    const data = JSON.stringify(result.result, null, "\t");

    if (!fs.existsSync(OUTPUT_PATH)) {
      fs.mkdirSync(OUTPUT_PATH, { recursive: true });
    }

    fs.writeFileSync(`${OUTPUT_PATH}/${result.framework}.json`, data);
  }

  process.exit(0);
}

(async () => await main())();
