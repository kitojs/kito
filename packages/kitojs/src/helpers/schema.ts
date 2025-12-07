// biome-ignore assist/source/organizeImports: ...
import type {
  SchemaDefinition,
  JSONSchemaDefinition,
  InferJSONSchemaRequest,
} from "@kitojs/types";

import { convertJSONSchema } from "../schemas/jsonSchema";

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

/**
 * Converts a JSON Schema definition to internal schema format
 * @template T - JSON Schema definition type
 * @param definition - JSON Schema definition object
 * @returns Converted schema definition with preserved types
 *
 * @example
 * ```typescript
 * import { schema } from 'kitojs';
 *
 * const userSchema = schema.json({
 *   params: {
 *     type: 'object',
 *     properties: {
 *       id: { type: 'string', format: 'uuid' }
 *     },
 *     required: ['id']
 *   },
 *   body: {
 *     type: 'object',
 *     properties: {
 *       name: { type: 'string', minLength: 1 },
 *       email: { type: 'string', format: 'email' }
 *     },
 *     required: ['name', 'email']
 *   }
 * });
 *
 * app.post('/users/:id', ({ req, res }) => {
 *   // types are inferred from JSON Schema
 *   const id = req.params.id; // string
 *   const name = req.body.name; // string
 * }, userSchema);
 * ```
 */
schema.json = <T extends JSONSchemaDefinition>(
  definition: T,
): SchemaDefinition & {
  __jsonSchemaInfer: InferJSONSchemaRequest<T>;
} => {
  // biome-ignore lint/suspicious/noExplicitAny: ...
  const converted: any = {};

  if (definition.params) {
    converted.params = convertJSONSchema(definition.params);
  }
  if (definition.query) {
    converted.query = convertJSONSchema(definition.query);
  }
  if (definition.body) {
    converted.body = convertJSONSchema(definition.body);
  }
  if (definition.headers) {
    converted.headers = convertJSONSchema(definition.headers);
  }
  if (definition.response) {
    converted.response = {};
    for (const [statusCode, responseSchema] of Object.entries(
      definition.response,
    )) {
      converted.response[statusCode] = convertJSONSchema(responseSchema);
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: ...
  return converted as any;
};
