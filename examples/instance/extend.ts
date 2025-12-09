import { server } from "kitojs";

interface Extends {
  user: { id: string; name: string };
}

const app = server().extend<Extends>((ctx) => {
  ctx.user = { id: "1", name: "Neo" };
});

app.get("/", ({ res, user }) => {
  res.json({ user });
});

app.listen(3000);
