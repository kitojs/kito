import { server } from "kitojs";

server()
  .get("/", ({ res }) => {
    const stream = res.stream();

    stream.write("Chunk 1\n");

    setTimeout(() => {
      stream.write("Chunk 2\n");
    }, 1000);

    setTimeout(() => {
      stream.end("Final chunk\n");
    }, 2000);
  })
  .listen(3000);
