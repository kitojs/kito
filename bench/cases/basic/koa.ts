import Koa from "koa";
import Router from "@koa/router";

export function start(port: number): { stop: () => void } {
  const app = new Koa();
  const router = new Router();

  router.get("/", (ctx) => {
    ctx.body = "hello world!";
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

  const appListen = app.listen(port);

  return {
    stop: async () => appListen.close(),
  };
}
