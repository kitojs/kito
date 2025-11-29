import { serve } from "@hono/node-server";
import { Hono } from "hono";

declare const Bun: any;

export function start(port: number): { stop: () => void } {
  const app = new Hono();

  app.get("/", (c) => c.text("hello world!"));

  if (typeof Bun !== "undefined") {
    const server = Bun.serve({
      fetch: app.fetch,
      port,
    });

    return {
      stop: () => server.stop(),
    };
  }

  const server = serve({
    fetch: app.fetch,
    port,
  });

  return {
    stop: async () => server.close(),
  };
}
