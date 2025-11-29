import { Elysia } from "elysia";
import { node } from "@elysiajs/node";

declare const Bun: any;


export function start(port: number): { stop: () => void } {
  const isBun = typeof Bun !== "undefined";

  const app = isBun ? new Elysia() : new Elysia({ adapter: node() });

  app.get("/", () => "hello world!");

  const server = app.listen(port);

  return {
    stop: async () => server.stop(),
  };
}
