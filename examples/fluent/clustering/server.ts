import { server } from "kitojs";

server({
    reusePort: true, // this is required for clustering
})
    .get("/", ({ res }) => res.send("hello world!"))
    .listen(3000, () => {
        console.log(`Worker ${process.pid} listening on port 3000`);
    });