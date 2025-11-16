import { server } from "kitojs";

interface Database {
  query: (sql: string) => unknown[];
}

const db: Database = {
  query: () => [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ],
};

const app = server().extend<{
  db: Database;
  user: { id: string; name: string };
}>((ctx) => {
  ctx.db = db;
  ctx.user = { id: "1", name: "Neo" };
});

app.get("/", (ctx) => {
  ctx.res.json({
    user: ctx.user.name,
    users: ctx.db.query("SELECT * FROM users"),
  });
});

app.listen(3000);
