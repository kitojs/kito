<div align="center">
  <img src=".github/assets/kito-banner.png" width="220px" />
  
  <br />
  <br />
  
  <p>
    <strong>High-performance</strong>, fully <strong>type-safe</strong>, and modern web framework for <strong>TypeScript</strong>.  
    Powered by <strong>Rust</strong> for extremely speed and low memory usage.
  </p>
</div>

---

- **Extreme performance** – Rust core optimized for extremely speed & efficiency. **See the [benchmarks](/bench).**
- **Type-safe** – full TypeScript support with end-to-end safety and exceptional DX.
- **Schema validation** – built-in validation with zero bloat.  
- **Middleware system** – composable and flexible like you expect.
- **Cross-platform** – runs on Node.js, Bun, and Deno.  

---

## 🚀 Quick Start

Install the official [**Kito CLI**](/cli) to scaffold and manage projects easily:

```bash
npm i -g @kitojs/cli
kito new hello
````

Or install Kito directly:

```bash
pnpm add kitojs   # Or: npm i kitojs
```

### Minimal Example

```ts
import { server } from "kitojs";

const app = server();

app.get("/", ctx => {
  ctx.res.send("hello world!");
});

app.listen(3000);
```

---

## 📚 Documentation

Full docs available at the [**official website**](https://kito.pages.dev).
You can also explore ready-to-run [examples](./examples).

---

## 🤝 Contributing

We welcome contributions! Check the [**contributing guide**](./contributing.md) to learn how to set up your environment and submit pull requests.

---

## 📄 License

Licensed under the [MIT License](./license).

---
