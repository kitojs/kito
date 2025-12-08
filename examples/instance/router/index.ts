import { server } from "kitojs";
import cats from "./cats";

const app = server();
app.mount("/cats", cats);

app.get("/", ({ res }) => {
  res.send("hello world!");
});

app.listen(3000);
