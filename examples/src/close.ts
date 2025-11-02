import { server } from "kitojs";

const app = server();

app.listen(3000);

setTimeout(() => {
  app.close();
  console.log("Server closed");
}, 5000);
