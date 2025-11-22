import cluster from "node:cluster";
import { availableParallelism } from "node:os";

import { server } from "kitojs";

if (cluster.isPrimary) {
  const numCPUs = availableParallelism();

  console.log(`Primary ${process.pid} is running`);
  console.log(`Starting ${numCPUs} workers...`);

  for (let i = 0; i < numCPUs; i++) cluster.fork();

  cluster.on("exit", (worker, code, signal) => {
    console.log(
      `Worker ${worker.process.pid} died (${signal || code}). Restarting...`,
    );

    cluster.fork();
  });
} else {
  const app = server({
    reusePort: true, // this is required for clustering
  });

  app.get("/", (ctx) => ctx.res.send("hello world!"));

  app.listen(3000, () => {
    console.log(`Worker ${process.pid} listening on port 3000`);
  });
}
