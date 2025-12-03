import type { Context } from "kitojs";
import { schema, server, t } from "kitojs";

const app = server();

const userSchema = schema({
  params: t.object({ id: t.str().uuid() }),
  query: t.object({ limit: t.num().min(1).max(100).default(10) }),
  body: t.object({ name: t.str().min(1) }),
});

type UserCtx = Context<typeof userSchema>;

app.get("/users/typed-only/:id", (ctx: UserCtx) => {
  const { req, res } = ctx;

  const { id } = req.params;
  const { limit } = req.query;

  res.send(`typed only: id=${id}, limit=${limit}`);
});

app.get("/users/validate-only/:id", [userSchema], ({ req, res }) => {
  const { id } = req.params;
  const { limit } = req.query;

  res.send(`validation only: id=${id}, limit=${limit}`);
});

app.post("/users/full/:id", [userSchema], (ctx: UserCtx) => {
  const { req, res } = ctx;

  const { id } = req.params;
  const { limit } = req.query;
  const { name } = req.body;

  res.json({ id, limit, name });
});

app.listen(3000);
