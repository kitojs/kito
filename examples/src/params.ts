import { server } from "kitojs";

const app = server();

app.get("/:id", ({ req, res }) => {
  const { id } = req.params;

  res.send(id);
});

app.get("/multi/:id/:name", ({ req, res }) => {
  const { id, name } = req.params;
  res.json({ id, name });
});

app.listen(3000);
