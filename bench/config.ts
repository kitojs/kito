export default {
  frameworks: [
    "kito",
    "express",
    "fastify",
    "hono",
    "restify",
    "tinyhttp",
    "koa",
  ],
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
