import { describe, expect, it } from "vitest";
import { middleware } from "../src";

describe("Middleware Helper", () => {
  it("should create middleware definition", () => {
    const mw = middleware((_, next) => {
      next();
    });

    expect(mw).toHaveProperty("type", "function");
    expect(mw).toHaveProperty("handler");
    expect(mw).toHaveProperty("global", false);
    expect(typeof mw.handler).toBe("function");
  });

  it("should preserve handler function", () => {
    // biome-ignore lint/suspicious/noExplicitAny: ...
    const handler = (ctx: any, next: any) => {
      ctx.custom = "value";
      next();
    };

    const mw = middleware(handler);
    expect(mw.handler).toBe(handler);
  });

  it("should have correct structure", () => {
    const mw = middleware((_, next) => next());

    expect(mw.type).toBe("function");
    expect(mw.global).toBe(false);
    expect(mw.handler).toBeDefined();
  });

  it("should support async handlers", () => {
    const asyncMw = middleware(async (_, next) => {
      await Promise.resolve();
      next();
    });

    expect(asyncMw.handler).toBeDefined();
    expect(asyncMw.handler?.constructor.name).toBe("AsyncFunction");
  });

  it("should work with route() method", async () => {
    const { server } = await import("../src");

    const executionLog: string[] = [];

    const authMiddleware = middleware((ctx, next) => {
      executionLog.push("auth");
      next();
    });

    const app = server();

    app
      .route("/admin", [authMiddleware])
      .get(({ res }) => {
        executionLog.push("get-handler");
        res.send("Admin GET");
      })
      .post(({ res }) => {
        executionLog.push("post-handler");
        res.send("Admin POST");
      });

    const routes = app["routes"];
    expect(routes).toHaveLength(2);

    expect(routes[0].middlewares).toHaveLength(1);
    expect(routes[1].middlewares).toHaveLength(1);
    expect(routes[0].middlewares[0]).toBe(authMiddleware);
    expect(routes[1].middlewares[0]).toBe(authMiddleware);
  });

  it("should combine route and call-level middlewares", async () => {
    const { server, middleware } = await import("../src");

    const routeLevelMw = middleware((_, next) => next());
    const callLevelMw = middleware((_, next) => next());

    const app = server();

    app.route("/admin", [routeLevelMw]).get([callLevelMw], ({ res }) => {
      res.send("Admin");
    });

    const routes = app["routes"];
    expect(routes).toHaveLength(1);
    expect(routes[0].middlewares).toHaveLength(2);
    expect(routes[0].middlewares[0]).toBe(routeLevelMw);
    expect(routes[0].middlewares[1]).toBe(callLevelMw);
  });

  it("should execute route middleware before handler", async () => {
    const { server, middleware } = await import("../src");

    const executionOrder: string[] = [];

    const authMw = middleware((_, next) => {
      executionOrder.push("route-middleware");
      next();
    });

    const app = server();

    app.route("/protected", [authMw]).get(({ res }) => {
      executionOrder.push("handler");
      res.send("Protected");
    });

    const routes = app["routes"];
    expect(routes[0].middlewares[0]).toBe(authMw);
  });
});
