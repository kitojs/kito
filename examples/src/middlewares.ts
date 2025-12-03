import { middleware, server } from "kitojs";

const app = server();

// global middlewares
// app.use(mw());

const auth = middleware((ctx, next) => {
  const { req, res } = ctx;

  const header = req.headers.authorization;

  if (header === "Bearer secret_token") {
    return next();
  }

  res.status(401).send("unauthorized");
});

// route middlewares
app.get("/", [auth], ({ res }) => {
  res.send("secret!");
});

app.listen(3000);
