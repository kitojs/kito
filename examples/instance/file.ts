import { server } from "kitojs";

const app = server();

app.get("/download", ({ res }) => {
  res.sendFile("public/banner.png", {
    root: "./",
    maxAge: 3600,
    lastModified: true,
    cacheControl: true,
    immutable: false,
    etag: true,
  });
});

app.get("/export", ({ res }) => {
  res.download("public/banner.png", "kito-banner.png");
});

app.listen(3000);
