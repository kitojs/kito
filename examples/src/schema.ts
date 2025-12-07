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

// JSON Schema

const userSchemaJSON = schema.json({
  params: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
    },
    required: ["id"],
  },
  query: {
    type: "object",
    properties: {
      limit: { type: "number", maximum: 100 },
    },
    required: ["limit"],
  },
  body: {
    type: "object",
    properties: {
      name: { type: "string", minLength: 1 },
    },
    required: ["name"],
  },
});

app.put(
  "/users/json/:id",
  ({ req, res }) => {
    // types are automatically inferred from userSchemaJSON
    const { id } = req.params;
    const { limit } = req.query;
    const { name } = req.body;

    res.json({ id, limit, name });
  },
  userSchemaJSON,
);

app.listen(3000);
