import { server } from "kitojs";

const app = server();

// all under the "/" path
const routes = app.route("/");

routes.get((ctx) => {
  ctx.res.send("hello world!");
});

routes.post((ctx) => {
  ctx.res.json({ body: ctx.req.body });
});

// normal route
app.get("/bye", (ctx) => {
  ctx.res.send("bye!");
});

app.listen(3000);

// fluent API style (using .end()):
server()
  .route("/")
  .get((ctx) => ctx.res.send("hello world!"))
  .post((ctx) => ctx.res.json({ body: ctx.req.body }))
  .end() // end route "/" builder, returns to the server
  .get("/bye", (ctx) => ctx.res.send("bye!"))
  .listen(3001);
