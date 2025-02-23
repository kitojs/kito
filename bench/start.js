import chalk from 'chalk';
import { program } from 'commander';
import { results, servers } from './consts.js';
import { startServer, stopServer } from './utils/server.js';
import { runBenchmark } from './utils/benchmark.js';
import { generateChart } from './utils/chart.js';

const run = async ({
  url,
  connections,
  duration,
  method,
  pipelining,
  genChartImage,
  chartImagePath,
  example,
}) => {
  if (genChartImage) {
    console.log(
      chalk.yellow(
        `The --chart flag was set, a chart image will be generated at ${chartImagePath} with the results.`,
      ),
    );
  }

  for (const { name, runner, args, extension } of servers) {
    const srv = await startServer(name, runner, args, extension, example);
    await runBenchmark({
      name,
      url,
      connections,
      duration,
      method,
      pipelining,
    });
    await stopServer(srv, name);
  }

  console.log(chalk.yellow('\nBenchmark results:'));
  console.table(
    results.map(({ name, reqPerSec, latency }) => ({
      Server: name,
      'Req/s': reqPerSec.toFixed(2),
      Latency: `${latency.toFixed(2)} ms`,
    })),
  );

  const fastest = results.reduce((max, server) =>
    server.reqPerSec > max.reqPerSec ? server : max,
  );
  console.log(
    chalk.magenta(
      `\nThe fastest server was ${chalk.bold(fastest.name)} with ${chalk.bold(
        fastest.reqPerSec.toFixed(2),
      )} req/s.`,
    ),
  );

  const bestLatency = results.reduce((min, server) =>
    server.latency < min.latency ? server : min,
  );
  console.log(
    chalk.blue(
      `The server with the best latency was ${chalk.bold(bestLatency.name)} with ${chalk.bold(
        bestLatency.latency.toFixed(2),
      )} ms.`,
    ),
  );

  if (genChartImage) generateChart(chartImagePath);
};

const init = () => {
  program
    .name('kito-bench')
    .description('Benchmarking Kito against other JavaScript web frameworks.');
  program
    .option('-u, --url <url>', 'Server URL')
    .option('-p, --port <port>', 'Server port')
    .option('-c, --connections <connections>', 'Number of connections')
    .option('-d, --duration <duration>', 'Duration of the benchmark in seconds')
    .option('-m, --method <method>', 'HTTP Method')
    .option('--pipelining <pipelining>', 'Number of pipelining requests')
    .option('--ch, --chart', 'Enable chart image generation')
    .option('--cip, --chart-image-path <path>', 'Path to save the chart image')
    .option(
      '-e, --example <example>',
      'The example to be run in the benchmarks',
    );

  program.parse(process.argv);
  const options = program.opts();

  const url =
    options.url ||
    (options.port
      ? `http://localhost:${options.port}`
      : 'http://localhost:3000');
  const connections = options.connections ? parseInt(options.connections) : 100;
  const duration = options.duration ? parseInt(options.duration) : 40;
  const method = options.method ? options.method : 'GET';
  const pipelining = options.pipelining ? parseInt(options.pipelining) : 10;
  const genChartImage = options.chart;
  const chartImagePath =
    options.chartImagePath || './bench/charts/results.jpeg';
  const example = options.example ? options.example : 'basic';

  run({
    url,
    connections,
    duration,
    method,
    pipelining,
    genChartImage,
    chartImagePath,
    example,
  }).catch((err) => console.error(chalk.red(err)));
};

init();
