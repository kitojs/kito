// biome-ignore assist/source/organizeImports: ...
import { describe, expectTypeOf, it } from "vitest";
import { server, schema, t, type Context } from "../src";

describe("Type Safety", () => {
  it("should infer schema types correctly", () => {
    const userSchema = schema({
      params: t.object({
        id: t.str().uuid(),
      }),
      query: t.object({
        limit: t.num().default(10),
      }),
      body: t.object({
        name: t.str(),
        email: t.str().email(),
        age: t.num().optional(),
      }),
    });

    type UserContext = Context<typeof userSchema>;

    expectTypeOf<UserContext["req"]["params"]>().toMatchTypeOf<{
      id: string;
    }>();

    expectTypeOf<UserContext["req"]["query"]>().toMatchTypeOf<{
      limit: number;
    }>();

    expectTypeOf<UserContext["req"]["body"]>().toMatchTypeOf<{
      name: string;
      email: string;
      age?: number;
    }>();
  });

  it("should infer optional fields", () => {
    const optionalSchema = schema({
      query: t.object({
        search: t.str().optional(),
        page: t.num().default(1),
      }),
    });

    type OptionalContext = Context<typeof optionalSchema>;

    expectTypeOf<OptionalContext["req"]["query"]>().toMatchTypeOf<{
      search?: string;
      page: number;
    }>();
  });

  it("should infer array types", () => {
    const arraySchema = schema({
      body: t.object({
        tags: t.array(t.str()),
        scores: t.array(t.num()),
      }),
    });

    type ArrayContext = Context<typeof arraySchema>;

    expectTypeOf<ArrayContext["req"]["body"]>().toMatchTypeOf<{
      tags: string[];
      scores: number[];
    }>();
  });

  it("should infer nested object types", () => {
    const nestedSchema = schema({
      body: t.object({
        user: t.object({
          name: t.str(),
          profile: t.object({
            bio: t.str(),
            avatar: t.str().url().optional(),
          }),
        }),
      }),
    });

    type NestedContext = Context<typeof nestedSchema>;

    expectTypeOf<NestedContext["req"]["body"]>().toMatchTypeOf<{
      user: {
        name: string;
        profile: {
          bio: string;
          avatar?: string;
        };
      };
    }>();
  });

  it("should infer literal types", () => {
    const literalSchema = schema({
      body: t.object({
        role: t.union(
          t.literal("admin"),
          t.literal("user"),
          t.literal("guest"),
        ),
        status: t.literal("active"),
      }),
    });

    type LiteralContext = Context<typeof literalSchema>;

    expectTypeOf<LiteralContext["req"]["body"]>().toMatchTypeOf<{
      role: "admin" | "user" | "guest";
      status: "active";
    }>();
  });

  it("should support extended context types", () => {
    interface Database {
      // biome-ignore lint/suspicious/noExplicitAny: ...
      query: (sql: string) => any;
    }

    const app = server().extend<{ db: Database }>((ctx) => {
      ctx.db = { query: () => {} };
    });

    app.get("/", (ctx) => {
      expectTypeOf(ctx).toHaveProperty("db");
      expectTypeOf(ctx.db).toHaveProperty("query");
    });
  });

  it("should chain extension types", () => {
    interface DB {
      query: () => void;
    }
    interface Cache {
      get: () => void;
    }

    const app = server()
      .extend<{ db: DB }>(() => ({ db: { query: () => {} } }))
      .extend<{ cache: Cache }>(() => ({ cache: { get: () => {} } }));

    app.get("/", (ctx) => {
      expectTypeOf(ctx).toHaveProperty("db");
      expectTypeOf(ctx).toHaveProperty("cache");
    });
  });
});
