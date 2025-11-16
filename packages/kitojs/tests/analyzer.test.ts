import { describe, expect, it } from "vitest";

import { analyzeHandler } from "../src/server/analyzer";
import type { Context } from "@kitojs/types";

describe("Static Response Analyzer", () => {
  it("should detect full static response", () => {
    const handler = (ctx: Context) => {
      ctx.res.json({ message: "hello" });
    };

    const result = analyzeHandler(handler);
    expect(result.type).toBe("full_static");
    if (result.type === "full_static") {
      expect(result.status).toBe(200);
      expect(result.method).toBe("json");
      expect(result.headers["content-type"]).toBe("application/json");
    }
  });

  it("should detect static text response", () => {
    const handler = (ctx: Context) => {
      ctx.res.text("hello world");
    };

    const result = analyzeHandler(handler);
    expect(result.type).toBe("full_static");
    if (result.type === "full_static") {
      expect(result.method).toBe("text");
      expect(result.headers["content-type"]).toBe("text/plain");
    }
  });

  it("should detect static HTML response", () => {
    const handler = (ctx: Context) => {
      ctx.res.html("<h1>Hello</h1>");
    };

    const result = analyzeHandler(handler);
    expect(result.type).toBe("full_static");
    if (result.type === "full_static") {
      expect(result.method).toBe("html");
      expect(result.headers["content-type"]).toBe("text/html");
    }
  });

  it("should detect non-static response with logic", () => {
    const handler = (ctx: Context) => {
      const data = Math.random();
      ctx.res.json({ data });
    };

    const result = analyzeHandler(handler);
    expect(result.type).toBe("none");
  });

  it("should detect non-static response with if statement", () => {
    const handler = (ctx: Context) => {
      if (ctx.req.query.admin) {
        ctx.res.send("admin");
      } else {
        ctx.res.send("user");
      }
    };

    const result = analyzeHandler(handler);
    expect(result.type).toBe("none");
  });

  it("should detect param template response", () => {
    const handler = (ctx: Context) => {
      ctx.res.json({
        id: ctx.req.params.id,
        name: ctx.req.params.name,
      });
    };

    const result = analyzeHandler(handler);
    expect(result.type).toBe("param_template");
    if (result.type === "param_template") {
      expect(result.params).toContain("id");
      expect(result.params).toContain("name");
      expect(result.template).toContain("{{params.id}}");
      expect(result.template).toContain("{{params.name}}");
    }
  });

  it("should detect none for complex handlers", () => {
    const handler = async (ctx: Context) => {
      const user = await fetchUser(ctx.req.params.id);
      ctx.res.json(user);
    };

    const result = analyzeHandler(handler);
    expect(result.type).toBe("none");
  });

  it("should detect none for multiple response calls", () => {
    const handler = (ctx: Context) => {
      ctx.res.send("first");
      ctx.res.send("second");
    };

    const result = analyzeHandler(handler);
    expect(result.type).toBe("none");
  });

  it("should handle arrow functions", () => {
    const handler = (ctx: Context) => {
      ctx.res.send("arrow");
    };

    const result = analyzeHandler(handler);
    expect(result.type).toBe("full_static");
  });

  it("should detect static object response", () => {
    const handler = (ctx: Context) => {
      ctx.res.json({
        status: "ok",
        version: "1.0.0",
        features: ["fast", "secure"],
      });
    };

    const result = analyzeHandler(handler);
    expect(result.type).toBe("full_static");
  });

  it("should detect none for variable declarations", () => {
    const handler = (ctx: Context) => {
      const message = "hello";
      ctx.res.send(message);
    };

    const result = analyzeHandler(handler);
    expect(result.type).toBe("none");
  });
});

function fetchUser(id: string) {
  return Promise.resolve({ id, name: "User" });
}
