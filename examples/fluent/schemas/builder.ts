import { schema, server, t } from "kitojs";

const userSchema = schema({
  params: t.object({ id: t.str().uuid() }),
  query: t.object({ limit: t.num().max(100) }),
  body: t.object({ name: t.str().min(1) }),
});

server()
  .post(
    "/users:id",
    ({ req, res }) => {
      const { id } = req.params;
      const { limit } = req.query;
      const { name } = req.body;

      res.json({ id, limit, name });
    },
    userSchema,
  )
  .listen(3000);
