import { server } from "kitojs";

server()
  .get("/", ({ res }) => {
    const sse = res.sse();

    sse.send("hello world!");

    sse.send({
      msg: "this is a message",
    }, "message");

    sse.close();
  })
  .listen(3000);
