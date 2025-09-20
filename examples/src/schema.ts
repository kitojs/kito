import type { Context } from "kitojs";
import { schema, server, t } from "kitojs";

const app = server();

const UserSchema = schema({
  params: t.object({ id: t.str().uuid() }),
  query: t.object({ limit: t.num().min(1).max(100).default(10) }),
  body: t.object({ name: t.str().min(1) }),
});

app.get("/users/:id/typed-only", (ctx: Context<typeof UserSchema>) => {
  const { id } = ctx.req.params;
  const { limit } = ctx.req.query;

  ctx.res.send(`typed only: id=${id}, limit=${limit}`);
});

app.get("/users/:id/validate-only", [UserSchema], (ctx) => {
  ctx.res.send("validated at runtime only!");
});

app.post("/users/:id/full", [UserSchema], (ctx: Context<typeof UserSchema>) => {
  const { id } = ctx.req.params;
  const { limit } = ctx.req.query;
  const { name } = ctx.req.body;

  ctx.res.json({ id, limit, name });
});

app.listen(3000);
