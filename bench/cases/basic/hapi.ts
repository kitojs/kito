import Hapi from "@hapi/hapi";

export function start(port: number): { stop: () => void } {
  const app = Hapi.server({ port });

  app.route({
    method: "GET",
    path: "/",
    handler: (request, h) => {
      return "hello world!";
    },
  });

  (async () => await app.start())();

  return {
    stop: async () => await app.stop(),
  };
}
