import { server } from "kitojs";

const app = server();

app.get("/", ({ res }) => {
  const sse = res.sse();

  sse.send("hello world!");

  sse.send({
    msg: "this is a message",
  }, "message");

  sse.close();
});

app.listen(3000);
