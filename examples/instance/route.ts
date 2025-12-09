import { server } from "kitojs";

const app = server();
const routes = app.route("/");

routes.get(({ res }) => {
  res.send("hello world!");
});

routes.post(({ req, res }) => {
  res.json({ body: req.body });
});

app.get("/bye", ({ res }) => {
  res.send("bye!");
});

app.listen(3000);
