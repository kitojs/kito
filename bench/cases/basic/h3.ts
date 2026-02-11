import { H3, serve } from "h3";

export function start(port: number): { stop: () => void } {
  const app = new H3();

  app.get("/", () => "hello world!");

  const server = serve(app, { port });

  return {
    stop: async () => server.close(),
  };
}
