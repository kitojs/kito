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
});
