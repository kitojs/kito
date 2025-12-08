import { server } from "kitojs";

server()
  .get("/", ({ res }) => {
    res.send("Hello from Unix socket!");
  })
  .listen({ unixSocket: "./app.sock" });
