import { server } from "kitojs";

const app = server();

app.get("/:id", (ctx) => {
  const { id } = ctx.req.params;

  ctx.res.send(id);
});

app.get("/multi/:id/:name", (ctx) => {
  const { id, name } = ctx.req.params;
  ctx.res.json({ id, name });
});

app.listen(3000);
