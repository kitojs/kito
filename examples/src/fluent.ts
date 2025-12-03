import { server } from "kitojs";

server()
  .get("/", ({ res }) => res.send("Hello world!"))
  .post("/echo", ({ req, res }) => res.json({ body: req.body }))
  .listen(3000);
