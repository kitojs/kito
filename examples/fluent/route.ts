import { server } from "kitojs";

server()
    .route("/")
    .get(({ res }) => {
        res.send("hello world!");
    })
    .post(({ req, res }) => {
        res.json({ body: req.body });
    })
    .end()
    .get("/bye", ({ res }) => {
        res.send("bye!");
    })
    .listen(3000);
