import Fastify from "fastify";

export function start(port: number): { stop: () => void } {
  const app = Fastify({
    logger: false,
  });

  app.get("/", (request, reply) => {
    reply.send("hello world!");
  });

  app.listen({ port });

  return {
    stop: async () => await app.close(),
  };
}
