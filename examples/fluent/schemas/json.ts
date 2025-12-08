import { schema, server } from "kitojs";

const userSchema = schema.json({
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

server()
  .post(
    "/users/:id",
    ({ req, res }) => {
      // types are automatically inferred from userSchema
      const { id } = req.params;
      const { limit } = req.query;
      const { name } = req.body;

      res.json({ id, limit, name });
    },
    userSchema,
  )
  .listen(3000);
