import type { MiddlewareDefinition, MiddlewareHandler } from "@kitojs/types";

export function middleware<TSchema = unknown>(
  handler: MiddlewareHandler<TSchema>,
): MiddlewareDefinition {
  return {
    type: "function",
    handler: handler as MiddlewareHandler,
    global: false,
  };
}
