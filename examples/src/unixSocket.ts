import { server } from "kitojs";

const app = server();

app.get("/", (ctx) => {
  ctx.res.send("Hello from Unix socket!");
});

app.listen({ unixSocket: "./app.sock" });
