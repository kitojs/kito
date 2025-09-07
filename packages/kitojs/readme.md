<img src="https://github.com/kitojs/.github/blob/58bb19cb207c67b9ca690e71f2b629e30bbf7b74/assets/kito-banner.png" />

> **Kito** is still in development and is not available at this time. When this notice is removed, you will know that the framework will be available.

---

**Kito** is a **high-performance**, **type-safe**, and modern web framework for TypeScript. It's written in Rust, leading in **speed** and **low memory usage** thanks to its **highly optimized** core. With schema validation, middleware, logging, caching, testing, and **much more.**

```ts
import { server } from "kitojs";
const app = server();

app.get("/", (ctx) => {
  ctx.res.send("hello world!");
});

app.listen(3000);
```

---

## 🚀 Quick Start

We recommend installing the official [**Kito CLI**](https://github.com/kitojs/cli), which comes with built-in tools and scaffolding, perfect for starting and managing projects.

```bash
npm i -g @kitojs/cli
```

Otherwise, you can add **Kito** to your project directly as a dependency and start using it:

```bash
pnpm add kitojs   # Or: npm i kitojs
```

---

## 📚 Documentation

All documentation can be found on the [**official website**](https://kito.pages.dev). You can also find usage examples in this repository, [here](https://github.com/kitojs/kito/dev/examples).

---

## ❤️ Contributing

If you're interested in contributing, you can read our [**contributing guide**](https://github.com/kitojs/kito/blob/dev/contributing.md) to learn how to set up your environment and organize contributions properly. **Everyone is welcome!**

---

## 📄 License

**Kito** is licensed under the [MIT License](https://github.com/kitojs/kito/blob/dev/license).

---