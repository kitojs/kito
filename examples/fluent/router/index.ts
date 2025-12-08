import { server } from "kitojs";
import cats from "./cats";

server()
  .mount("/cats", cats)
  .get("/", ({ res }) => res.send("hello world!"))
  .listen(3000);
