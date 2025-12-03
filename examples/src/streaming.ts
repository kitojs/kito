import { server } from "kitojs";

const app = server();

// streaming
app.get("/stream", ({ res }) => {
  const stream = res.stream();

  stream.write("Chunk 1\n");

  setTimeout(() => {
    stream.write("Chunk 2\n");
  }, 1000);

  setTimeout(() => {
    stream.end("Final chunk\n");
  }, 2000);
});

// sse
app.get("/events", ({ res }) => {
  const sse = res.sse();

  sse.send({ msg: "connected" }, "init");

  let count = 0;

  const interval = setInterval(() => {
    sse.send({ count }, "update");
    count++;

    if (count >= 5) {
      clearInterval(interval);
      sse.send({ msg: "done" }, "complete");
      sse.close();
    }
  }, 1000);
});

app.listen(3000, () => {
  console.log("Streaming server running on http://localhost:3000");
});
