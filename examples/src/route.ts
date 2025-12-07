import { middleware, server } from "kitojs";

const app = server();

// all under the "/" path
const routes = app.route("/");

routes.get(({ res }) => {
  res.send("hello world!");
});

routes.post(({ req, res }) => {
  res.json({ body: req.body });
});

// normal route
app.get("/bye", ({ res }) => {
  res.send("bye!");
});

app.listen(3000);

// route middlewares

const logger = middleware((ctx, next) => {
  console.log(`${ctx.req.method} ${ctx.req.url}`);
  next();
});

const routes2 = app.route("/mw", [logger]);

routes2.get(({ res }) => {
  res.send("hello world with middleware!");
});

routes2.post(({ req, res }) => {
  res.json({ body: req.body });
});

// fluent API style (using .end()):
server()
  .route("/")
  .get(({ res }) => res.send("hello world!"))
  .post(({ req, res }) => res.json({ body: req.body }))
  .end() // end route "/" builder, returns to the server
  .get("/bye", ({ res }) => res.send("bye!"))
  .listen(3001);
