<img src="https://github.com/kitojs/.github/blob/882f94e7c1bb1c463ad475539aa4d53a2eeef1d5/assets/kito-logo.svg" width="200px" align="right" />

# Kito - `packages`

This folder contains all the **modular packages** that make up the Kito framework.  
It is part of the **monorepo** managed with [`pnpm workspaces`](https://pnpm.io/workspaces).

Each package is **independent**, versioned, and published under the `@kitojs/*` namespace (except `packages/kitojs`).

---

## 📂 Project structure

```
📂 packages/
├── 📂 cli
│   ├── 📄 Cargo.toml
│   ├── 📄 package.json
│   ├── 📄 install.js
│   ├── 📄 .gitignore
│   └── 📂 src
│       ├── 📄 commands.rs
│       ├── 📄 main.rs
│       └── 📄 utils.rs
├── 📂 core
│   ├── 📄 Cargo.toml
│   ├── 📄 package.json
│   ├── 📄 build.rs
│   ├── 📄 .gitignore
│   ├── 📂 src
│   │   ├── 📄 lib.rs
│   │   ├── 📄 server.rs
│   │   ├── 📄 http.rs
│   │   ├── 📂 http
│   │   ├── 📂 server
│   │   └── 📂 validation
│   └── 📄 tsconfig.json
├── 📂 kitojs
│   ├── 📄 package.json
│   ├── 📄 tsconfig.json
│   ├── 📄 tsdown.config.ts
│   ├── 📂 src
│   │   ├── 📄 index.ts
│   │   ├── 📂 server
│   │   ├── 📂 helpers
│   │   └── 📂 schemas
│   └── 📄 .gitignore
├── 📂 types
│   ├── 📄 package.json
│   ├── 📄 tsconfig.json
│   ├── 📄 tsdown.config.ts
│   ├── 📂 src
│   │   ├── 📄 index.d.ts
│   │   ├── 📄 context.d.ts
│   │   ├── 📄 routes.d.ts
│   │   ├── 📄 handlers.d.ts
│   │   ├── 📂 schema
│   │   └── 📂 http
│   └── 📄 .gitignore
└── 📄 readme.md
```

---

## 📦 Packages

### `@kitojs/kito-core`
- The **Rust core** of the framework, exposing high-performance HTTP server functionality via [N-API](https://github.com/napi-rs/napi-rs).  
- Responsibilities:
  - Handling HTTP requests/responses efficiently.  
  - Route and middleware execution.  
  - Validation of request schemas and automatic error handling.  
  - Integration with JS/TS through N-API bindings.  
- This package is **fully written in Rust**, compiled to a native module, and serves as the runtime for all server logic.

### `@kitojs/kito-cli`
- Command-line interface to scaffold and manage Kito projects.  
- Features:
  - Project initialization (`kito init`, `kito new`).
  - Running local servers and hot reload.
  - Helpers to manage routes, schemas, and project metadata.

### `kitojs` (TypeScript library)
- Main **TypeScript wrapper** for Kito, exposing the framework API to developers.  
- Responsibilities:
  - Create and configure servers (`app.get`, `app.post`, `app.use`, etc.).  
  - Define route schemas, middleware, and static responses.  
  - Utilities for schema building, validation, and server context.  
  - Analyze route handlers for static/dynamic optimization.  
- This package **depends on `kito-core`** for the runtime, but provides a developer-friendly API.

### `@kitojs/types`
- Standalone package containing **TypeScript type definitions** for Kito.  
- Features:
  - Type definitions for request, response, and server context.
  - Route, schema, and handler typings.
  - Shared types between core, CLI, and the TS library.
- Designed to enable **full type safety** in TypeScript projects using Kito.

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
