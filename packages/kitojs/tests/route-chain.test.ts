import type { SchemaDefinition } from "@kitojs/types";
import { describe, expect, it, vi } from "vitest";
import { middleware, router, server } from "../src";

describe("Route Chaining", () => {
  describe("Server Chaining", () => {
    it("should support fluent API (method chaining)", () => {
      const app = server();
      expect(() => {
        app
          .get("/", (ctx) => ctx.res.send("home"))
          .post("/users", (ctx) => ctx.res.json({ created: true }))
          .get("/about", (ctx) => ctx.res.send("about"));
      }).not.toThrow();

      // biome-ignore lint/complexity/useLiteralKeys: ...
      const routes = app["routes"];
      expect(routes).toHaveLength(3);
    });

    it("should use route() builder", () => {
      const app = server();
      const routes = app.route("/api");

      expect(typeof routes.get).toBe("function");
      expect(typeof routes.post).toBe("function");
      expect(typeof routes.end).toBe("function");
    });

    it("should chain routes and end", () => {
      const app = server();
      expect(() => {
        app
          .route("/api")
          .get((ctx) => ctx.res.send("get"))
          .post((ctx) => ctx.res.send("post"))
          .end()
          .get("/", (ctx) => ctx.res.send("home"));
      }).not.toThrow();

      // biome-ignore lint/complexity/useLiteralKeys: ...
      const routes = app["routes"];
      expect(routes).toHaveLength(3);
    });

    it("should work correctly with server().route() chaining and core registration", async () => {
      const app = server();
      // biome-ignore lint/complexity/useLiteralKeys: ...
      const spy = vi.spyOn(app["coreServer"], "addRoute");

      app
        .route("/direct")
        .get((ctx) => ctx.res.send("get"))
        .post((ctx) => ctx.res.send("post"));

      // biome-ignore lint/complexity/useLiteralKeys: ...
      const routes = app["routes"];
      expect(
        routes.find((r) => r.path === "/direct" && r.method === "GET"),
      ).toBeDefined();
      expect(
        routes.find((r) => r.path === "/direct" && r.method === "POST"),
      ).toBeDefined();

      // Verify it's actually registered in the core server via spy
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ path: "/direct", method: "GET" }),
      );
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ path: "/direct", method: "POST" }),
      );
    });

    it("should correctly handle schema in server().route() chaining", () => {
      const app = server();
      // biome-ignore lint/complexity/useLiteralKeys: ...
      const spy = vi.spyOn(app["coreServer"], "addRoute");

      // Use proper schema builder mock
      const userSchema = {
        params: {
          _serialize: () => JSON.stringify({ id: "string" }),
        },
      };

      app.route("/search").get((ctx) => ctx.res.send("ok"), userSchema as any);

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          path: "/search",
          method: "GET",
          schema: JSON.stringify({ params: JSON.stringify({ id: "string" }) }),
        }),
      );
    });
  });

  describe("Router Chaining", () => {
    it("should handle route chaining", () => {
      const r = router();
      r.route("/users")
        .get((ctx) => ctx.res.send("list"))
        .post((ctx) => ctx.res.send("create"));

      // biome-ignore lint/complexity/useLiteralKeys: ...
      const routes = r["routes"];
      expect(
        routes.find((r) => r.method === "GET" && r.path === "/users"),
      ).toBeDefined();
      expect(
        routes.find((r) => r.method === "POST" && r.path === "/users"),
      ).toBeDefined();
    });

    it("should support all HTTP methods in a chain", () => {
      const r = router();
      r.route("/multi")
        .get((ctx) => ctx.res.send("get"))
        .post((ctx) => ctx.res.send("post"))
        .put((ctx) => ctx.res.send("put"))
        .delete((ctx) => ctx.res.send("delete"))
        .patch((ctx) => ctx.res.send("patch"))
        .head((ctx) => ctx.res.send("head"))
        .options((ctx) => ctx.res.send("options"));

      // biome-ignore lint/complexity/useLiteralKeys: ...
      const routes = r["routes"];
      expect(routes).toHaveLength(7);
      const methods = routes.map((r) => r.method);
      expect(methods).toContain("GET");
      expect(methods).toContain("POST");
      expect(methods).toContain("PUT");
      expect(methods).toContain("DELETE");
      expect(methods).toContain("PATCH");
      expect(methods).toContain("HEAD");
      expect(methods).toContain("OPTIONS");
    });

    it("should apply route-level middlewares to all methods in the chain", () => {
      const mw = middleware((_ctx, next) => next());
      const r = router();
      r.route("/chain-mw", [mw])
        .get((ctx) => ctx.res.send("ok"))
        .post((ctx) => ctx.res.send("ok"));

      // biome-ignore lint/complexity/useLiteralKeys: ...
      const routes = r["routes"];
      expect(routes[0].middlewares).toHaveLength(1);
      expect(routes[1].middlewares).toHaveLength(1);
      expect(routes[0].middlewares[0]).toBe(mw);
      expect(routes[1].middlewares[0]).toBe(mw);
    });

    it("should correctly combine route-level and method-level middlewares", () => {
      const routeMw = middleware((_ctx, next) => next());
      const methodMw = middleware((_ctx, next) => next());
      const r = router();

      r.route("/combined", [routeMw]).get([methodMw], (ctx) =>
        ctx.res.send("ok"),
      );

      // biome-ignore lint/complexity/useLiteralKeys: ...
      const routes = r["routes"];
      expect(routes[0].middlewares).toHaveLength(2);
      expect(routes[0].middlewares[0]).toBe(routeMw);
      expect(routes[0].middlewares[1]).toBe(methodMw);
    });

    it("should support schema application for individual methods in a chain", () => {
      const schema = { params: { id: "string" } };
      const r = router();

      r.route("/schema").get(
        (ctx) => ctx.res.send("ok"),
        schema as unknown as SchemaDefinition,
      );

      // biome-ignore lint/complexity/useLiteralKeys: ...
      const routes = r["routes"];
      // middlewares should contain the schema if provided
      expect(routes[0].middlewares).toContain(schema);
    });

    it("should work correctly when the router is mounted on a server", () => {
      const sub = router();
      sub
        .route("/resource")
        .get((ctx) => ctx.res.send("get"))
        .post((ctx) => ctx.res.send("post"));

      const app = server();
      app.mount("/api", sub);

      // biome-ignore lint/complexity/useLiteralKeys: ...
      const routes = app["routes"];
      expect(
        routes.find((r) => r.path === "/api/resource" && r.method === "GET"),
      ).toBeDefined();
      expect(
        routes.find((r) => r.path === "/api/resource" && r.method === "POST"),
      ).toBeDefined();
    });
  });
});
