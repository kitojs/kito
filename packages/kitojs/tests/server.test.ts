// biome-ignore assist/source/organizeImports: ...
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { server, middleware, schema, t } from "../src";

describe("Server", () => {
  let app: ReturnType<typeof server>;

  beforeEach(() => {
    app = server();
  });

  afterEach(() => {
    if (app) {
      app.close();
    }
  });

  describe("Creation", () => {
    it("should create server instance", () => {
      expect(app).toBeDefined();
      expect(typeof app.get).toBe("function");
      expect(typeof app.post).toBe("function");
      expect(typeof app.listen).toBe("function");
    });

    it("should create server with options", () => {
      const appWithOptions = server({ port: 4000, host: "127.0.0.1" });
      expect(appWithOptions).toBeDefined();
      appWithOptions.close();
    });
  });

  describe("Route Registration", () => {
    it("should register GET route", () => {
      expect(() => {
        app.get("/", (ctx) => {
          ctx.res.send("hello");
        });
      }).not.toThrow();
    });

    it("should register POST route", () => {
      expect(() => {
        app.post("/users", (ctx) => {
          ctx.res.json({ success: true });
        });
      }).not.toThrow();
    });

    it("should register PUT route", () => {
      expect(() => {
        app.put("/users/:id", (ctx) => {
          ctx.res.send("updated");
        });
      }).not.toThrow();
    });

    it("should register DELETE route", () => {
      expect(() => {
        app.delete("/users/:id", (ctx) => {
          ctx.res.sendStatus(204);
        });
      }).not.toThrow();
    });

    it("should register PATCH route", () => {
      expect(() => {
        app.patch("/users/:id", (ctx) => {
          ctx.res.send("patched");
        });
      }).not.toThrow();
    });

    it("should register route with schema", () => {
      const userSchema = schema({
        params: t.object({ id: t.str().uuid() }),
      });

      expect(() => {
        app.get("/users/:id", [userSchema], (ctx) => {
          ctx.res.json({ id: ctx.req.params.id });
        });
      }).not.toThrow();
    });

    it("should register route with middleware", () => {
      const auth = middleware((_, next) => {
        next();
      });

      expect(() => {
        app.get("/protected", [auth], (ctx) => {
          ctx.res.send("secret");
        });
      }).not.toThrow();
    });

    it("should register route with multiple middlewares", () => {
      const auth = middleware((_, next) => next());
      const logger = middleware((_, next) => next());

      expect(() => {
        app.get("/admin", [auth, logger], (ctx) => {
          ctx.res.send("admin");
        });
      }).not.toThrow();
    });
  });

  describe("Global Middleware", () => {
    it("should register global middleware", () => {
      const globalMw = middleware((_, next) => {
        next();
      });

      expect(() => {
        app.use(globalMw);
      }).not.toThrow();
    });

    it("should register global middleware as function", () => {
      expect(() => {
        app.use((_, next) => {
          next();
        });
      }).not.toThrow();
    });
  });

  describe("Route Chaining", () => {
    it("should support fluent API", () => {
      expect(() => {
        app
          .get("/", (ctx) => ctx.res.send("home"))
          .post("/users", (ctx) => ctx.res.json({ created: true }))
          .get("/about", (ctx) => ctx.res.send("about"));
      }).not.toThrow();
    });

    it("should use route() builder", () => {
      const routes = app.route("/api");

      expect(typeof routes.get).toBe("function");
      expect(typeof routes.post).toBe("function");
      expect(typeof routes.end).toBe("function");
    });

    it("should chain routes and end", () => {
      expect(() => {
        app
          .route("/api")
          .get((ctx) => ctx.res.send("get"))
          .post((ctx) => ctx.res.send("post"))
          .end()
          .get("/", (ctx) => ctx.res.send("home"));
      }).not.toThrow();
    });
  });

  describe("Extension", () => {
    it("should extend context", () => {
      const extendedApp = app.extend<{ db: { query: () => string } }>((ctx) => {
        ctx.db = { query: () => "result" };
      });

      expect(extendedApp).toBeDefined();
      extendedApp.close();
    });

    it("should extend context with return value", () => {
      const extendedApp = app.extend<{ user: { id: string } }>((_) => {
        return { user: { id: "123" } };
      });

      expect(extendedApp).toBeDefined();
      extendedApp.close();
    });

    it("should chain multiple extensions", () => {
      const extended = app
        // biome-ignore lint/suspicious/noExplicitAny: ...
        .extend<{ db: any }>((_) => ({ db: {} }))
        // biome-ignore lint/suspicious/noExplicitAny: ...
        .extend<{ cache: any }>((_) => ({ cache: {} }));

      expect(extended).toBeDefined();
      extended.close();
    });
  });

  describe("Listen", () => {
    it("should have listen method", () => {
      expect(typeof app.listen).toBe("function");
    });

    it("should have close method", () => {
      expect(typeof app.close).toBe("function");
    });
  });
});
