import { server } from "kitojs";

server()
  .get("/download", ({ res }) => {
    res.sendFile("public/banner.png", {
      root: "./",
      maxAge: 3600,
      lastModified: true,
      cacheControl: true,
      immutable: false,
    });
  })
  .get("/export", ({ res }) => {
    res.download("public/banner.png", "kito-banner.png");
  })
  .listen(3000);
