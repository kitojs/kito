import autocannon from 'autocannon';
import chalk from 'chalk';
import { results } from '../consts.js';

export const runBenchmark = ({
  name,
  url,
  connections,
  duration,
  method,
  pipelining,
}) => {
  return new Promise((resolve, reject) => {
    console.log(chalk.blue(`\nBenchmarking ${name}...`));

    autocannon(
      {
        url,
        connections,
        duration,
        method,
        pipelining,
      },
      (err, result) => {
        if (err) return reject(err);

        const reqPerSec = result.requests.average;
        const latency = result.latency.average;
        results.push({ name, reqPerSec, latency });

        console.log(
          chalk.green(
            `${name} - req/s: ${reqPerSec.toFixed(2)}, latency: ${latency.toFixed(2)} ms`,
          ),
        );
        resolve();
      },
    );
  });
};
