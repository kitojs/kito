import { server } from "kitojs";

const app = server();

app.get("/:id", ({ req, res }) => {
  res.send(req.params.id);
});

app.get("/multi/:id/:name", ({ req, res }) => {
  const { id, name } = req.params;
  res.json({ id, name });
});

app.listen(3000);
