import { server } from "kitojs";

server()
  .get("/", ({ res }) => res.send("hello world!"))
  .listen(3000);
