/**
 * @module kitojs
 *
 * Kito is a high-performance, type-safe TypeScript web framework with a Rust core.
 *
 * @example Basic usage
 * ```typescript
 * import { server } from 'kitojs';
 *
 * const app = server();
 *
 * app.get('/', ctx => {
 *   ctx.res.send('Hello World!');
 * });
 *
 * app.listen(3000);
 * ```
 *
 * @example With schema validation
 * ```typescript
 * import { server, schema, t } from 'kitojs';
 *
 * const userSchema = schema({
 *   params: t.object({ id: t.str().uuid() }),
 *   body: t.object({
 *     name: t.str().min(1),
 *     email: t.str().email()
 *   })
 * });
 *
 * app.post('/users/:id', [userSchema], ctx => {
 *   ctx.res.json({
 *     id: ctx.req.params.id,
 *     ...ctx.req.body
 *   });
 * });
 * ```
 *
 * @example With middleware
 * ```typescript
 * import { server, middleware } from 'kitojs';
 *
 * const logger = middleware((ctx, next) => {
 *   console.log(`${ctx.req.method} ${ctx.req.url}`);
 *   next();
 * });
 *
 * app.use(logger);
 * ```
 *
 * @example With context extensions
 * ```typescript
 * const app = server().extend<{ db: Database }>(ctx => {
 *   ctx.db = createDatabase();
 * });
 *
 * app.get('/users', async ctx => {
 *   const users = await ctx.db.query('SELECT * FROM users');
 *   ctx.res.json(users);
 * });
 * ```
 */

// biome-ignore assist/source/organizeImports: ...
export * from "./schemas/builders";

export * from "./helpers/schema";
export * from "./helpers/middleware";

export * from "./server/server";
export * from "./types";
