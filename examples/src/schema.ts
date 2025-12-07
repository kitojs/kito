import { schema, server, t } from "kitojs";

const app = server();

const userSchema = schema({
  params: t.object({ id: t.str().uuid() }),
  query: t.object({ limit: t.num().max(100) }),
  body: t.object({ name: t.str().min(1) }),
});

app.get(
  "/users/:id",
  ({ req, res }) => {
    // types are automatically inferred from userSchema
    const { id } = req.params;
    const { limit } = req.query;

    res.send(`id=${id}, limit=${limit}`);
  },
  userSchema,
);

app.post(
  "/users/full/:id",
  ({ req, res }) => {
    const { id } = req.params;
    const { limit } = req.query;
    const { name } = req.body;

    res.json({ id, limit, name });
  },
  userSchema,
);

app.listen(3000);
