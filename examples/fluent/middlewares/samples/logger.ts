import { middleware } from "kitojs";

export const logger = middleware((ctx, next) => {
  const { method, url } = ctx.req;
  const date = new Date().toISOString();

  console.log(`[${date}] ${method} ${url}`);
  return next();
});
