import { server } from "kitojs";

server()
  .get("/", (ctx) => ctx.res.send("Hello world!"))
  .post("/echo", (ctx) => ctx.res.json({ body: ctx.req.body }))
  .listen(3000);
