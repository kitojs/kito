import { exec } from "node:child_process";
import config from "../config.ts";

const { duration, connections } = config;

export type WrkResult = {
  requests: { average: number };
  latency: { average: number };
  throughput: { average: number };
};

export const runBenchmark = (url: string) => {
  return new Promise<WrkResult>((resolve, reject) => {
    const cmd = `wrk -t${connections} -c${connections} -d${duration}s -H "Connection: keep-alive" ${url}`;

    exec(cmd, (err, stdout) => {
      if (err) {
        reject(err);
        return;
      }

      const output = stdout.toString();

      const reqMatch = output.match(/Requests\/sec:\s*([\d.]+)/);
      const requests = reqMatch ? parseFloat(reqMatch[1]) : 0;

      const latMatch = output.match(/Latency\s+([\d.]+)(ms|s|us)/);
      let latency = 0;
      if (latMatch) {
        const v = parseFloat(latMatch[1]);
        const unit = latMatch[2];
        if (unit === "s") latency = v * 1000;
        else if (unit === "us") latency = v / 1000;
        else latency = v;
      }

      const tpMatch = output.match(/Transfer\/sec:\s*([\d.]+)(KB|MB|B)/);
      let throughput = 0;
      if (tpMatch) {
        const v = parseFloat(tpMatch[1]);
        const unit = tpMatch[2];
        if (unit === "MB") throughput = v * 1024 * 1024;
        else if (unit === "KB") throughput = v * 1024;
        else throughput = v;
      }

      resolve({
        requests: { average: requests },
        latency: { average: latency },
        throughput: { average: throughput },
      });
    });
  });
};
