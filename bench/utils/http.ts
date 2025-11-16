import autocannon from "autocannon";

import config from "../config.ts";
const { duration, connections, pipelining, workers } = config;

export const runBenchmark = async (url: string) => {
  return new Promise<autocannon.Result>((resolve, reject) => {
    const instance = autocannon(
      {
        url,
        duration,
        connections,
        pipelining: pipelining || 1,
        workers: workers || undefined,
        timeout: 10,
        bailout: undefined,
        maxConnectionRequests: undefined,
        maxOverallRequests: undefined,
        connectionRate: undefined,
        overallRate: undefined,
        amount: undefined,
        reconnectRate: undefined,
        idReplacement: false,
        setupClient: undefined,
      },
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      },
    );

    instance.on("done", () => {
      instance.stop();
    });
  });
};
