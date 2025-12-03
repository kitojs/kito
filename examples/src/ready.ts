import { server } from "kitojs";

const app = server();

app.get("/", ({ res }) => {
  res.send("hello world!");
});

app.listen(3000, () => {
  console.log(`Ready at http://localhost:3000`);
});

/*

app.listen(3000, "127.0.0.1", () => {
  console.log(`Ready at http://127.0.0.1:3000`);
});

*/

/* 

app.listen();

*/
