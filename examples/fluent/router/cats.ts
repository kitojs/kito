import { router } from "kitojs";

export default router()
  .get("/", ({ res }) => {
    res.send("hello cats!");
  })
  .post("/", ({ res }) => {
    res.json({ msg: "cat created!" });
  });
