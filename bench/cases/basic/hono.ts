import { serve } from "@hono/node-server";
import { Hono } from "hono";

export function start(port: number): { stop: () => void } {
  const app = new Hono();

  app.get("/", (c) => c.text("hello world!"));

  const appListen = serve({
    fetch: app.fetch,
    port,
  });

  return {
    stop: async () => appListen.close(),
  };
}
