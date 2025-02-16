<div align="center">

<img src="https://github.com/kitojs/.github/blob/ab511c572ae2362cd1cc33737536835db3284e96/logo.png" alt="Kito Logo" width="150px" />

A **web framework** written in **Rust** for **TypeScript**.

</div>

---

## 👋🏼 What is Kito

**Kito** is an ultra-modern _web framework_ that combines the power of **Rust**
with the simplicity and elegance of **TypeScript**. Designed to be _minimalist_,
_blazing-fast_, and _extremely secure_, Kito allows you to build
_high-performance_ applications with a _clean_, _user-friendly_, and _end-to-end
type-safe API_.

Under the hood, **Kito** is powered by
**[Actix](https://github.com/actix/actix-web)**, one of the fastest and most
robust **Rust** frameworks in the world. The **TypeScript** API allows you to
define routes, middlewares, and all the logic without needing to touch **Rust**.

---

## 🚀 Quick Start

Install Kito and create your first application in just a few minutes.

```bash
deno add jsr:kito
```

A simple example of an API with a route:

```typescript
import { kito } from 'kito'

const app = kito()

app.get('/', (req, res) => {
	res.send('Hello, world!')
})

app.listen(3000)
```

Your server is running on `http://localhost:3000`, responding with "Hello,
world!". It's that simple!

---

## ✨ Features

- 🚀 **Extremely fast**: Thanks to Rust and Actix, Kito achieves speeds that
  surpass all existing web frameworks in the ecosystem. Check it out in the
  [benchmarks](./bench).
- 📝 **Type-Safe end-to-end**: Enjoy type safety from client to server, inspired
  by the approach of [tRPC](https://trpc.io).
- 🔧 **Extensible**: Define routes, middlewares, and all application logic
  without limitations.
- 💻 **Friendly API**: Minimalist, clean, and easy to understand. Writing code
  in Kito feels natural and familiar.

---

## 📚 Documentation

Check out the full documentation at [kito.pages.dev](https://kito.pages.dev) to
learn more about Kito.

---

## ✍️ Contributing

Want to help improve Kito? Take a look at the
[CONTRIBUTING.md](./CONTRIBUTING.md) for important information on how to
contribute to the project.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE). Enjoy it and help
it grow.

---
