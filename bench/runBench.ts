import autocannon from "autocannon";
import { runBenchmark } from "./utils/http.ts";

import config from "./config.ts";
const { hostname, frameworks, chart } = config;

import { generateChart } from "./utils/chart.ts";

import fs from "node:fs";

type BenchmarkResult = {
  framework: string;
  autocannonResult: autocannon.Result;
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

    if (!mod || (!mod.default && !mod.start)) {
      console.error(
        `Could not find benchmark for framework "${framework}" and benchmark "${benchName}"`,
      );
      process.exit(1);
    }

    const bench = mod.default || mod;
    const { stop } = bench.start(port);

    console.log(`Running benchmark for ${framework}...`);
    const URL = `http://${hostname}:${port}`;

    const result = await runBenchmark(URL);
    results.push({ framework, autocannonResult: result });

    port++;

    await stop();
  }

  console.table(
    results.map(({ framework, autocannonResult }) => ({
      Framework: framework,
      "Requests/sec": autocannonResult.requests.average,
      "Latency (ms)": autocannonResult.latency.average,
      "Throughput (bytes/sec)": autocannonResult.throughput.average,
    })),
  );

  if (chart?.enabled) {
    const output = chart.output || "results/charts/result.png";
    await generateChart(
      {
        frameworks: results.map((r) => r.framework),
        requests: results.map((r) => r.autocannonResult.requests.average),
        latency: results.map((r) => r.autocannonResult.latency.average),
        throughput: results.map((r) => r.autocannonResult.throughput.average),
      },
      output,
    );
  }

  for (const result of results) {
    const OUTPUT_PATH = "results/data";
    const data = JSON.stringify(result.autocannonResult, null, '\t');

    if (!fs.existsSync(OUTPUT_PATH)) {
      fs.mkdirSync(OUTPUT_PATH, { recursive: true });
    }

    fs.writeFileSync(`${OUTPUT_PATH}/${result.framework}.json`, data);
  }

  process.exit(0);
}

(async () => await main())();
