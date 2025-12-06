import { router, server } from "kitojs";

// create a cats router
const cats = router();

cats.get("/", ({ res }) => {
  res.send("List of cats");
});

cats.get("/:id", ({ res, req }) => {
  res.send(`Cat with id: ${req.params.id}`);
});

cats.post("/", ({ res }) => {
  res.json({ message: "Cat created!" });
});

// create a dogs router
const dogs = router();

dogs.get("/", ({ res }) => {
  res.send("List of dogs");
});

dogs.get("/:id", ({ res, req }) => {
  res.send(`Dog with id: ${req.params.id}`);
});

// create an API router that mounts both cats and dogs
const api = router();

api.mount("/cats", cats);
api.mount("/dogs", dogs);

api.get("/", ({ res }) => {
  res.json({ message: "Welcome to the API" });
});

// create the main server and mount the API router
const app = server();
app.mount("/api", api);

app.get("/", ({ res }) => {
  res.send("Hello World!");
});

app.listen(3000);
