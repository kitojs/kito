import { server } from "kitojs";

const app = server();

app.get("/", ({ res }) => {
  res.send("hello world!");
});

app.listen(3000);
