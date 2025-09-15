<img src="https://github.com/kitojs/.github/blob/1461ad6c9d6eb7f952c3fbd3a6ed3c21dd78eebb/assets/kito-logo.png" width="200px" align="right" />

# Kito - `packages`

This folder contains all the **modular packages** that make up the Kito framework.  
It is part of the **monorepo** managed with [`pnpm workspaces`](https://pnpm.io/workspaces).

Each package is **independent**, versioned, and published under the `@kitojs/*` namespace (except `packages/kitojs`).

---

## 📂 Project structure

```
📦packages
┣ 📂core        # @kitojs/kito-core
┃ ┣ 📂src
┃ ┃ ┗ 📜lib.rs        # Main Rust source file, entrypoint for the N-API bindings
┃ ┣ 📜Cargo.toml      # Rust crate manifest (dependencies, metadata)
┃ ┣ 📜build.rs        # Build script (used to configure napi-rs build steps)
┃ ┣ 📜package.json    # JS/TS package manifest (defines the npm package)
┃ ┗ 📜.gitignore      # Local ignore rules for this package
┗ 📜readme.md         # This file (overview of all packages)
```

---

## 📦 Packages

### `@kitojs/kito-core`
- The **bridge** between TypeScript and the Rust core (via [N-API](https://github.com/napi-rs/napi-rs)).  
- Exposes the main API surface:  
  - `server()` creation.  
  - Route definition (`app.get`, `app.post`, etc.).  
  - Middleware registration (`app.use`).  
  - Integration with schema validators.  
- Internally, it gathers all route/middleware/validation metadata and forwards it to the Rust runtime, where execution happens.

---

## 🛠️ Development workflow

Inside the monorepo, you can work on packages in isolation or all together:

```bash
# Build all packages
pnpm build

# Build only a package
pnpm --filter @kitojs/pkg build
````

Each package is published independently but linked locally via the workspace.

---