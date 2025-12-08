import { server } from "kitojs";

server()
  .get("/:id", ({ req, res }) => res.send(req.params.id))
  .get("/multi/:id/:name", ({ req, res }) => {
    const { id, name } = req.params;
    res.json({ id, name });
  })
  .listen(3000);
