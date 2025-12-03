import { server } from "kitojs";

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

// fluent API style (using .end()):
server()
  .route("/")
  .get(({ res }) => res.send("hello world!"))
  .post(({ req, res }) => res.json({ body: req.body }))
  .end() // end route "/" builder, returns to the server
  .get("/bye", ({ res }) => res.send("bye!"))
  .listen(3001);
