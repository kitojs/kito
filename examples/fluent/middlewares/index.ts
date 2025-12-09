import { server } from "kitojs";

import { auth } from "./samples/auth";
import { logger } from "./samples/logger";

server()
  .use(logger)
  .get("/", auth, ({ res }) => res.send("hello world!"))
  .listen(3000);
