import type { Route } from "@kitojs/kito-core";
import type { MiddlewareDefinition } from "@kitojs/types";
import { describe, expect, it, vi } from "vitest";
import { middleware, router, server } from "../src";

describe("Router", () => {
  describe("Basic Routing", () => {
    it("should register routes with different HTTP methods", () => {
      const r = router();
      r.get("/get", (ctx) => ctx.res.send("get"));
      r.post("/post", (ctx) => ctx.res.send("post"));
      r.put("/put", (ctx) => ctx.res.send("put"));
      r.delete("/delete", (ctx) => ctx.res.send("delete"));
      r.patch("/patch", (ctx) => ctx.res.send("patch"));

      // biome-ignore lint/complexity/useLiteralKeys: ...
      const routes = r["routes"];
      expect(
        routes.find((r) => r.method === "GET" && r.path === "/get"),
      ).toBeDefined();
      expect(
        routes.find((r) => r.method === "POST" && r.path === "/post"),
      ).toBeDefined();
      expect(
        routes.find((r) => r.method === "PUT" && r.path === "/put"),
      ).toBeDefined();
      expect(
        routes.find((r) => r.method === "DELETE" && r.path === "/delete"),
      ).toBeDefined();
      expect(
        routes.find((r) => r.method === "PATCH" && r.path === "/patch"),
      ).toBeDefined();
    });

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
  });

  describe("Middleware", () => {
    it("should work with NO middleware", async () => {
      const api = router();
      api.get("/ping", ({ res }) => res.send("pong"));

      const app = server();
      app.mount("/api", api);

      // biome-ignore lint/complexity/useLiteralKeys: ...
      const routes = app["routes"];
      const route = routes.find((r) => r.path === "/api/ping");

      expect(route).toBeDefined();
      expect(route?.middlewares).toHaveLength(0);
    });

    it("should register local middlewares for a route", () => {
      const mw = middleware((_ctx, next) => next());
      const r = router();
      r.get("/test", [mw], (ctx) => ctx.res.send("ok"));

      // biome-ignore lint/complexity/useLiteralKeys: ...
      const routes = r["routes"];
      const route = routes.find((r) => r.path === "/test");
      expect(route?.middlewares).toHaveLength(1);
      expect((route?.middlewares[0] as MiddlewareDefinition).handler).toBe(
        mw.handler,
      );
    });

    it("should register global middlewares for all routes", () => {
      const mw = middleware((_ctx, next) => next());
      const r = router();
      r.use(mw);
      r.get("/test", (ctx) => ctx.res.send("ok"));

      // biome-ignore lint/complexity/useLiteralKeys: ...
      expect(r["getMiddlewares"]()).toHaveLength(1);
    });

    it("should handle middleware that throws an error", async () => {
      const app = server();
      const mw = middleware(() => {
        throw new Error("Middleware Error");
      });

      // biome-ignore lint/complexity/useLiteralKeys: ...
      const addRouteSpy = vi.spyOn(app["coreServer"], "addRoute");

      app.get("/error", [mw], (ctx) => ctx.res.send("ok"));

      const call = addRouteSpy.mock.calls.find(
        (c) => (c[0] as Route).path === "/error",
      );
      if (!call) throw new Error("Route not registered");
      const handler = (call[0] as Route).handler;

      const mockCtx = {
        req: {
          method: "GET",
          url: "/error",
          headers: {},
          params: {},
          query: {},
          body: {},
        },
        res: {
          status: vi.fn().mockReturnThis(),
          send: vi.fn().mockReturnThis(),
          json: vi.fn().mockReturnThis(),
          header: vi.fn().mockReturnThis(),
          cookie: vi.fn().mockReturnThis(),
        },
      };

      await expect(handler(mockCtx)).rejects.toThrow("Middleware Error");
    });
  });

  describe("Router Mounting", () => {
    describe("Middleware Inheritance", () => {
      it("should correctly propagate sub-router middleware", async () => {
        const mw = middleware((_ctx, next) => next());
        const api = router();
        api.use(mw);
        api.get("/test", ({ res }) => res.send("ok"));

        const app = server();
        app.mount("/api", api);

        // biome-ignore lint/complexity/useLiteralKeys: ...
        const routes = app["routes"];
        const route = routes.find((r) => r.path === "/api/test");

        expect(route).toBeDefined();
        expect(route?.middlewares).toHaveLength(1);

        const firstMw = route?.middlewares[0] as MiddlewareDefinition;
        if (firstMw) {
          expect(firstMw.handler).toBe(mw.handler);
          expect(firstMw.global).toBe(true);
        } else {
          throw new Error("Middleware should be defined");
        }
      });

      it("should preserve order: sub-router middleware then route middleware", async () => {
        const mwGlobal = middleware((_ctx, next) => next());
        const mwRoute = middleware((_ctx, next) => next());

        const api = router();
        api.use(mwGlobal);
        api.get("/test", [mwRoute], ({ res }) => res.send("ok"));

        const app = server();
        app.mount("/api", api);

        // biome-ignore lint/complexity/useLiteralKeys: ...
        const routes = app["routes"];
        const route = routes.find((r) => r.path === "/api/test");

        expect(route?.middlewares).toHaveLength(2);

        const firstMw = route?.middlewares[0] as MiddlewareDefinition;
        const secondMw = route?.middlewares[1] as MiddlewareDefinition;

        if (firstMw && secondMw) {
          expect(firstMw.handler).toBe(mwGlobal.handler);
          expect(secondMw.handler).toBe(mwRoute.handler);
        } else {
          throw new Error("Middlewares should be defined");
        }
      });

      it("should handle nested router mounting and maintain order", async () => {
        const mwA = middleware((_ctx, next) => next());
        const mwB = middleware((_ctx, next) => next());
        const mwC = middleware((_ctx, next) => next());

        const routerC = router();
        routerC.use(mwC);
        routerC.get("/end", ({ res }) => res.send("done"));

        const routerB = router();
        routerB.use(mwB);
        routerB.mount("/c", routerC);

        const routerA = router();
        routerA.use(mwA);
        routerA.mount("/b", routerB);

        const app = server();
        app.mount("/sub", routerA);

        // biome-ignore lint/complexity/useLiteralKeys: ...
        const routes = app["routes"];
        const route = routes.find((r) => r.path === "/sub/b/c/end");

        expect(route).toBeDefined();
        expect(route?.middlewares).toHaveLength(3);

        if (route) {
          const mws = route.middlewares as MiddlewareDefinition[];
          expect(mws[0].handler).toBe(mwA.handler);
          expect(mws[1].handler).toBe(mwB.handler);
          expect(mws[2].handler).toBe(mwC.handler);
        }
      });

      it("should handle deep nested mounting with correct middleware order", async () => {
        const m1 = middleware((_ctx, next) => next());
        const m2 = middleware((_ctx, next) => next());
        const m3 = middleware((_ctx, next) => next());

        const r3 = router()
          .use(m3)
          .get("/p3", ({ res }) => res.send("3"));
        const r2 = router().use(m2).mount("/r3", r3);
        const r1 = router().use(m1).mount("/r2", r2);

        const app = server();
        app.mount("/r1", r1);

        // biome-ignore lint/complexity/useLiteralKeys: ...
        const routes = app["routes"];
        const route = routes.find((r) => r.path === "/r1/r2/r3/p3");

        expect(route).toBeDefined();
        expect(route?.middlewares).toHaveLength(3);

        if (route) {
          const mws = route.middlewares as MiddlewareDefinition[];
          expect(mws[0].handler).toBe(m1.handler);
          expect(mws[1].handler).toBe(m2.handler);
          expect(mws[2].handler).toBe(m3.handler);
        }
      });
    });

    describe("Isolation", () => {
      it("should ensure middleware isolation between sub-routers", async () => {
        const mw1 = middleware((_ctx, next) => next());
        const mw2 = middleware((_ctx, next) => next());

        const api1 = router();
        api1.use(mw1);
        api1.get("/r1", ({ res }) => res.send("ok"));

        const api2 = router();
        api2.use(mw2);
        api2.get("/r2", ({ res }) => res.send("ok"));

        const app = server();
        app.mount("/api1", api1);
        app.mount("/api2", api2);

        // biome-ignore lint/complexity/useLiteralKeys: ...
        const routes = app["routes"];
        const route1 = routes.find((r) => r.path === "/api1/r1");
        const route2 = routes.find((r) => r.path === "/api2/r2");

        expect(route1?.middlewares).toHaveLength(1);
        expect(route2?.middlewares).toHaveLength(1);

        const mw1Entry = route1?.middlewares[0] as MiddlewareDefinition;
        const mw2Entry = route2?.middlewares[0] as MiddlewareDefinition;

        if (mw1Entry) expect(mw1Entry.handler).toBe(mw1.handler);
        if (mw2Entry) expect(mw2Entry.handler).toBe(mw2.handler);

        // Ensure NO bleeding
        expect(
          route1?.middlewares.some(
            (m) => (m as MiddlewareDefinition).handler === mw2.handler,
          ),
        ).toBe(false);
        expect(
          route2?.middlewares.some(
            (m) => (m as MiddlewareDefinition).handler === mw1.handler,
          ),
        ).toBe(false);
      });

      it("should avoid middleware bleeding between siblings in deep nesting", async () => {
        const common = middleware((_ctx, next) => next());
        const leftMw = middleware((_ctx, next) => next());
        const rightMw = middleware((_ctx, next) => next());

        const left = router()
          .use(leftMw)
          .get("/l", ({ res }) => res.send("l"));
        const right = router()
          .use(rightMw)
          .get("/r", ({ res }) => res.send("r"));

        const root = router()
          .use(common)
          .mount("/left", left)
          .mount("/right", right);

        const app = server();
        app.mount("/api", root);

        // biome-ignore lint/complexity/useLiteralKeys: ...
        const routes = app["routes"];
        const leftRoute = routes.find((r) => r.path === "/api/left/l");
        const rightRoute = routes.find((r) => r.path === "/api/right/r");

        expect(leftRoute?.middlewares).toHaveLength(2);
        expect(rightRoute?.middlewares).toHaveLength(2);

        const leftMws = (leftRoute?.middlewares ||
          []) as MiddlewareDefinition[];
        const rightMws = (rightRoute?.middlewares ||
          []) as MiddlewareDefinition[];

        expect(leftMws[0].handler).toBe(common.handler);
        expect(leftMws[1].handler).toBe(leftMw.handler);
        expect(rightMws[0].handler).toBe(common.handler);
        expect(rightMws[1].handler).toBe(rightMw.handler);

        expect(leftMws.some((m) => m.handler === rightMw.handler)).toBe(false);
        expect(rightMws.some((m) => m.handler === leftMw.handler)).toBe(false);
      });

      it("should ensure middleware defined in router A is NOT applied in router B", async () => {
        const mwA = middleware((_ctx, next) => next());
        const mwB = middleware((_ctx, next) => next());

        const routerA = router()
          .use(mwA)
          .get("/a", ({ res }) => res.send("a"));
        const routerB = router()
          .use(mwB)
          .get("/b", ({ res }) => res.send("b"));

        const app = server();
        app.mount("/group", routerA);
        app.mount("/group", routerB);

        // biome-ignore lint/complexity/useLiteralKeys: ...
        const routes = app["routes"];
        const routeA = routes.find((r) => r.path === "/group/a");
        const routeB = routes.find((r) => r.path === "/group/b");

        expect(routeA?.middlewares).toHaveLength(1);
        expect(routeB?.middlewares).toHaveLength(1);

        expect(
          routeA?.middlewares.some(
            (m) => (m as MiddlewareDefinition).handler === mwB.handler,
          ),
        ).toBe(false);
        expect(
          routeB?.middlewares.some(
            (m) => (m as MiddlewareDefinition).handler === mwA.handler,
          ),
        ).toBe(false);
      });
    });

    it("should handle mixed route mounting: direct routes and sub-routers", async () => {
      const subMw = middleware((_ctx, next) => next());

      const sub = router();
      sub.use(subMw);
      sub.get("/sub-route", ({ res }) => res.send("ok"));

      const app = server();
      app.get("/direct", ({ res }) => res.send("ok"));
      app.mount("/mounted", sub);

      // biome-ignore lint/complexity/useLiteralKeys: ...
      const appRoutes = app["routes"];
      const directRoute = appRoutes.find((r) => r.path === "/direct");
      const mountedRoute = appRoutes.find(
        (r) => r.path === "/mounted/sub-route",
      );

      expect(directRoute?.middlewares).toHaveLength(0);
      expect(mountedRoute?.middlewares).toHaveLength(1);

      const firstMw = mountedRoute?.middlewares[0] as MiddlewareDefinition;
      if (firstMw) {
        expect(firstMw.handler).toBe(subMw.handler);
      }
    });

    it("should handle mounting at root path '/'", () => {
      const sub = router();
      sub.get("/test", (ctx) => ctx.res.send("ok"));

      const app = server();
      app.mount("/", sub);

      // biome-ignore lint/complexity/useLiteralKeys: ...
      const routes = app["routes"];
      expect(routes.find((r) => r.path === "/test")).toBeDefined();
    });

    it("should handle mounting with trailing slashes", () => {
      const sub = router();
      sub.get("/test/", (ctx) => ctx.res.send("ok"));

      const app = server();
      app.mount("/api/", sub);

      // biome-ignore lint/complexity/useLiteralKeys: ...
      const routes = app["routes"];
      expect(routes.find((r) => r.path === "/api/test")).toBeDefined();
    });

    it("should handle redundant slashes in mounting", () => {
      const sub = router();
      sub.get("//test", (ctx) => ctx.res.send("ok"));

      const app = server();
      app.mount("//api//", sub);

      // biome-ignore lint/complexity/useLiteralKeys: ...
      const routes = app["routes"];
      expect(routes.find((r) => r.path.includes("test"))).toBeDefined();
    });

    it("should handle mounting an empty router", () => {
      const sub = router();
      const app = server();

      expect(() => app.mount("/api", sub)).not.toThrow();
      // biome-ignore lint/complexity/useLiteralKeys: ...
      expect(app["routes"]).toHaveLength(0);
    });
  });

  describe("Server Integration", () => {
    it("should correctly propagate and execute sub-router middlewares", async () => {
      const app = server();
      const mwCalled = vi.fn();
      const mw = middleware((_ctx, next) => {
        mwCalled();
        return next();
      });

      const sub = router();
      sub.get("/test", [mw], (ctx) => ctx.res.send("ok"));

      // biome-ignore lint/complexity/useLiteralKeys: ...
      const addRouteSpy = vi.spyOn(app["coreServer"], "addRoute");

      app.mount("/api", sub);

      expect(addRouteSpy).toHaveBeenCalled();

      // Find the registered handler for the mounted route
      const call = addRouteSpy.mock.calls.find(
        (c) => (c[0] as Route).path === "/api/test",
      );
      expect(call).toBeDefined();

      const registeredHandler = (call as [Route])[0].handler;

      // Mock context to simulate server execution
      const mockCtx = {
        req: {
          method: "GET",
          url: "/api/test",
          headers: {},
          params: {},
          query: {},
          body: {},
        },
        res: {
          status: vi.fn().mockReturnThis(),
          send: vi.fn().mockReturnThis(),
          json: vi.fn().mockReturnThis(),
          header: vi.fn().mockReturnThis(),
          cookie: vi.fn().mockReturnThis(),
        },
      };

      try {
        await registeredHandler(mockCtx);
      } catch (_e) {
        // Ignore potential channel/response builder errors in mock environment
      }

      // Verification: The middleware on the sub-router MUST have been called
      expect(mwCalled).toHaveBeenCalled();
    });

    it("should register routes with correctly fused middlewares in core server", async () => {
      const mwCalled = vi.fn();
      const mw = middleware((_ctx, next) => {
        mwCalled();
        return next();
      });

      const sub = router();
      sub.use(mw);
      sub.get("/test", (ctx) => ctx.res.send("ok"));

      const app = server();
      // biome-ignore lint/complexity/useLiteralKeys: ...
      const addRouteSpy = vi.spyOn(app["coreServer"], "addRoute");

      app.mount("/api", sub);

      expect(addRouteSpy).toHaveBeenCalled();

      const call = addRouteSpy.mock.calls.find(
        (c) => (c[0] as Route).path === "/api/test",
      );
      expect(call).toBeDefined();

      const registeredHandler = (call?.[0] as Route).handler;

      const mockCtx = {
        req: {
          method: "GET",
          url: "/api/test",
          headers: {},
          params: {},
          query: {},
          body: {},
        },
        res: {
          status: vi.fn().mockReturnThis(),
          send: vi.fn().mockReturnThis(),
          json: vi.fn().mockReturnThis(),
          header: vi.fn().mockReturnThis(),
          cookie: vi.fn().mockReturnThis(),
        },
      };

      try {
        await registeredHandler(mockCtx);
      } catch (_e) {
        // Ignore crashes
      }

      expect(mwCalled).toHaveBeenCalled();
    });
  });
});
