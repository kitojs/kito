import express from "express";

export function start(port: number): { stop: () => void } {
  const app = express();

  app.get("/", (req, res) => {
    res.send("hello world!");
  });

  const appListen = app.listen(port);

  return {
    stop: async () => appListen.close(),
  };
}
