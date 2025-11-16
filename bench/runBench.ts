import { runBenchmark } from "./utils/http.ts";

import config from "./config.ts";
const { hostname, frameworks, chart } = config;

import { generateChart } from "./utils/chart.ts";
import { waitForServerReady } from "./utils/wait.ts";

import fs from "node:fs";

type BenchmarkResult = {
  framework: string;
  result: {
    requests: { average: number };
    latency: { average: number };
    throughput: { average: number };
  };
};

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

  for (const framework of frameworks) {
    const mod = await import(`./cases/${benchName}/${framework}.ts`);

    const bench = mod.default || mod;
    const { stop } = bench.start(port);
    await waitForServerReady(port);

    console.log(`Running benchmark for ${framework}...`);
    const URL = `http://${hostname}:${port}`;

    const result = await runBenchmark(URL);
    results.push({ framework, result });

    port++;

    await stop();
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
