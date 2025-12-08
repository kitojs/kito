import cluster from "node:cluster";
import { availableParallelism } from "node:os";

if (cluster.isPrimary) {
    const numCPUs = availableParallelism();

    console.log(`Primary ${process.pid} is running`);
    console.log(`Starting ${numCPUs} workers...`);

    for (let i = 0; i < numCPUs; i++) cluster.fork();
} else {
    import("./server");
}
