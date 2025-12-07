import type { SchemaDefinition } from "@kitojs/types";

/**
 * Creates a typed schema definition for request validation.
 * This is a type helper that preserves schema structure for type inference.
 *
 * @template T - Schema definition type
 * @param definition - Schema definition object
 * @returns The same schema definition with preserved types
 *
 * @example
 * ```typescript
 * import { schema, t } from 'kitojs';
 *
 * const userSchema = schema({
 *   params: t.object({
 *     id: t.str().uuid()
 *   }),
 *   query: t.object({
 *     limit: t.num().min(1).max(100).default(10)
 *   }),
 *   body: t.object({
 *     name: t.str().min(1),
 *     email: t.str().email()
 *   }),
 *   headers: t.object({
 *     authorization: t.str()
 *   })
 * });
 *
 * app.post('/users/:id', ({ req, res }) => {
 *   // All request parts are type-safe and validated
 *   const id = req.params.id; // string (UUID validated)
 *   const limit = req.query.limit; // number
 *   const name = req.body.name; // string
 * }, userSchema);
 * ```
 */
export function schema<T extends SchemaDefinition>(definition: T): T {
  return definition;
}
