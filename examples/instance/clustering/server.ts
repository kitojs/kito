import { server } from "kitojs";

const app = server({
  reusePort: true, // this is required for clustering
});

app.get("/", ({ res }) => res.send("hello world!"));

app.listen(3000, () => {
  console.log(`Worker ${process.pid} listening on port 3000`);
});
