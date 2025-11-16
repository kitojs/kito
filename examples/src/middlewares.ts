import { middleware, server } from "kitojs";

const app = server();

// global middlewares
// app.use(mw());

const auth = middleware((ctx, next) => {
  const header = ctx.req.headers.authorization;

  if (header === "Bearer secret_token") {
    return next();
  }

  ctx.res.status(401).send("unauthorized");
});

// route middlewares
app.get("/", [auth], (ctx) => {
  ctx.res.send("secret!");
});

app.listen(3000);
