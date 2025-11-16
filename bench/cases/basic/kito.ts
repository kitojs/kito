import { server } from "kitojs";

export function start(port: number): { stop: () => void } {
  const app = server();

  app.get("/", (ctx) => {
    ctx.res.send("hello world!");
  });

  app.listen(port);

  return {
    stop: async () => app.close(),
  };
}
