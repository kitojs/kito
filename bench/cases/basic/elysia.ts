import { Elysia } from "elysia";

export function start(port: number): { stop: () => void } {
  const app = new Elysia();

  app.get("/", () => "hello world!");

  const appListen = app.listen(port);

  return {
    stop: async () => appListen.stop(),
  };
}
