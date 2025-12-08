import { server } from "kitojs";

interface Extends {
  user: { id: string; name: string };
}

server()
  .extend<Extends>((ctx) => {
    ctx.user = { id: "1", name: "Neo" };
  })
  .get("/", ({ res, user }) => {
    res.json({ user });
  })
  .listen(3000);
