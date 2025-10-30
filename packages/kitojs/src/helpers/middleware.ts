import type { MiddlewareDefinition, MiddlewareHandler } from "@kitojs/types";

// biome-ignore lint/suspicious/noExplicitAny: ...
export function middleware<TExtensions = any>(
  // biome-ignore lint/suspicious/noExplicitAny: ...
  handler: MiddlewareHandler<any, TExtensions>,
): MiddlewareDefinition {
  return {
    type: "function",
    handler: handler as MiddlewareHandler,
    global: false,
  };
}
