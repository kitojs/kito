import { server } from "kitojs";

import { auth } from "./samples/auth";
import { logger } from "./samples/logger";

const app = server();
app.use(logger);

app.get("/", auth, ({ res }) => {
  res.send("hello world!");
});

app.listen(3000);
