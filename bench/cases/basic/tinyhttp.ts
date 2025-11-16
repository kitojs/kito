import { App } from "@tinyhttp/app";

export function start(port: number): { stop: () => void } {
  const app = new App();

  app.get("/", (req, res) => {
    res.send("hello world!");
  });

  const appListen = app.listen(port);

  return {
    stop: async () => appListen.close(),
  };
}
