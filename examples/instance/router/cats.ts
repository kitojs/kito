import { router } from "kitojs";

const cats = router();

cats.get("/", ({ res }) => {
  res.send("hello cats!");
});

cats.post("/", ({ res }) => {
  res.json({ msg: "cat created!" });
});

export default cats;
