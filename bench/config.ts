type FrameworkConfig = {
  name: string;
  runtime?: "bun" | "node";
};

type FrameworkRuntime = "bun" | "node";

export default {
  frameworks: [
    { name: "kito" },
    { name: "elysia", runtime: "bun" },
    { name: "express" },
    { name: "fastify" },
    { name: "hono", runtime: "bun" },
    { name: "restify", runtime: "node" },
    { name: "tinyhttp" },
    { name: "koa" },
    { name: "hapi" },
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
