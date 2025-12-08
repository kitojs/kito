import { middleware } from "kitojs";

export const auth = middleware((ctx, next) => {
  const { req, res } = ctx;
  const header = req.headers.authorization;

  if (header && header === "Bearer secret_token") {
    return next();
  }

  res.status(401).send("unauthorized");
});
