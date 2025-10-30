import { server } from "kitojs";

const app = server();

app.get("/download", (ctx) => {
  ctx.res.sendFile("public/banner.png", {
    root: "./",
    maxAge: 3600,
    lastModified: true,
    cacheControl: true,
    immutable: false,
  });
});

app.get("/export", (ctx) => {
  ctx.res.download("public/banner.png", "kito-banner.png");
});

app.listen(3000);
