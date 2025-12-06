import type { MiddlewareDefinition, MiddlewareHandler } from "@kitojs/types";

/**
 * Creates a typed middleware definition.
 *
 * @template TExtensions - Type of context extensions available in the middleware
 * @param handler - Middleware function that processes requests
 * @returns Middleware definition object
 *
 * @example
 * ```typescript
 * import { middleware } from 'kitojs';
 *
 * // Basic middleware
 * const logger = middleware((ctx, next) => {
 *   console.log(`${ctx.req.method} ${ctx.req.url}`);
 *   next();
 * });
 *
 * // Authentication middleware
 * const auth = middleware((ctx, next) => {
 *   const token = ctx.req.headers.authorization;
 *
 *   if (!token || !verifyToken(token)) {
 *     ctx.res.status(401).send('Unauthorized');
 *     return;
 *   }
 *
 *   next();
 * });
 *
 * // Async middleware
 * const asyncAuth = middleware(async (ctx, next) => {
 *   const user = await validateUser(ctx.req.headers.authorization);
 *   if (!user) {
 *     ctx.res.status(401).send('Unauthorized');
 *     return;
 *   }
 *   await next();
 * });
 *
 * // Using middleware
 * app.use(logger); // global
 *
 * // Route middleware
 * app.get('/protected', [auth], ctx => {
 *   ctx.res.send('Secret data');
 * });
 * ```
 */
export function middleware<TSchema = unknown, TExtensions = unknown>(
  handler: MiddlewareHandler<TSchema, TExtensions>,
): MiddlewareDefinition {
  return {
    type: "function",
    handler: handler as MiddlewareHandler,
    global: false,
  };
}
