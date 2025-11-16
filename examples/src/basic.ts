import { server } from "kitojs";

const app = server();

app.get("/", (ctx) => {
  ctx.res.send("hello world!");
});

app.listen(3000);
