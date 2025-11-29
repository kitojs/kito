type FrameworkConfig = string;

type FrameworkRuntime = "bun" | "node";

export default {
  frameworks: [
    "kito",
    "elysia",
    "express",
    "fastify",
    "hono",
    "restify",
    "tinyhttp",
    "koa",
    "hapi",
  ] satisfies FrameworkConfig[],
  hostname: "localhost",

  connections: 100,
  pipelining: 10,
  duration: 30,
  workers: undefined,

  chart: {
    enabled: true,
    output: "results/charts/result.png",
  },
};

export type { FrameworkConfig, FrameworkRuntime };
