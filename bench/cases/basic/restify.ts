import restify from "restify";

export function start(port: number): { stop: () => void } {
  const app = restify.createServer();

  app.get("/", (req, res, next) => {
    res.send("hello world!");
    return next();
  });

  app.listen(port);

  return {
    stop: async () => app.close(),
  };
}
