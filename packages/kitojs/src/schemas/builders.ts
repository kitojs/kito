// biome-ignore assist/source/organizeImports: ...
import { StringSchemaImpl } from "./primitives/string";
import { NumberSchemaImpl } from "./primitives/number";
import { BooleanSchemaImpl } from "./primitives/boolean";
import { ArraySchemaImpl } from "./primitives/array";
import { ObjectSchemaImpl } from "./primitives/object";
import { LiteralSchemaImpl } from "./primitives/literal";
import { UnionSchemaImpl } from "./primitives/union";

import type {
  StringSchema,
  NumberSchema,
  BooleanSchema,
  ArraySchema,
  ObjectSchema,
  LiteralSchema,
  UnionSchema,
  SchemaType,
} from "@kitojs/types";

/**
 * Schema builder utilities for creating type-safe request validation schemas.
 *
 * @example
 * ```typescript
 * import { t, schema } from 'kitojs';
 *
 * const userSchema = schema({
 *   params: t.object({
 *     id: t.str().uuid()
 *   }),
 *   body: t.object({
 *     name: t.str().min(1).max(50),
 *     email: t.str().email(),
 *     age: t.num().min(0).optional()
 *   })
 * });
 *
 * app.post('/users/:id', [userSchema], ctx => {
 *   // ctx.req.params.id is validated as UUID
 *   // ctx.req.body is type-safe and validated
 * });
 * ```
 */
export const t = {
  /**
   * Creates a string schema builder.
   *
   * @returns String schema with validation methods
   *
   * @example
   * ```typescript
   * t.str() // basic string
   * t.str().min(3).max(50) // length constraints
   * t.str().email() // email validation
   * t.str().uuid() // UUID validation
   * t.str().optional() // optional field
   * t.str().default('hello') // default value
   * ```
   */
  str(): StringSchema {
    return new StringSchemaImpl();
  },

  /**
   * Creates a number schema builder.
   *
   * @returns Number schema with validation methods
   *
   * @example
   * ```typescript
   * t.num() // basic number
   * t.num().min(0).max(100) // range constraints
   * t.num().int() // integer only
   * t.num().positive() // positive numbers
   * t.num().optional() // optional field
   * t.num().default(0) // default value
   * ```
   */
  num(): NumberSchema {
    return new NumberSchemaImpl();
  },

  /**
   * Creates a boolean schema builder.
   *
   * @returns Boolean schema with validation methods
   *
   * @example
   * ```typescript
   * t.bool() // basic boolean
   * t.bool().optional() // optional field
   * t.bool().default(false) // default value
   * ```
   */
  bool(): BooleanSchema {
    return new BooleanSchemaImpl();
  },

  /**
   * Creates an array schema builder.
   *
   * @template T - Type of array items
   * @param item - Schema for array items
   * @returns Array schema with validation methods
   *
   * @example
   * ```typescript
   * t.array(t.str()) // string array
   * t.array(t.num().positive()) // array of positive numbers
   * t.array(t.object({ name: t.str() })) // array of objects
   * t.array(t.str()).min(1).max(10) // length constraints
   * ```
   */
  array<T extends SchemaType>(item: T): ArraySchema<T> {
    return new ArraySchemaImpl(item);
  },

  /**
   * Creates an object schema builder.
   *
   * @template T - Object shape definition
   * @param shape - Object property schemas
   * @returns Object schema with validation methods
   *
   * @example
   * ```typescript
   * t.object({
   *   name: t.str(),
   *   age: t.num(),
   *   email: t.str().email().optional()
   * })
   *
   * // Nested objects
   * t.object({
   *   user: t.object({
   *     profile: t.object({
   *       bio: t.str()
   *     })
   *   })
   * })
   * ```
   */
  object<T extends Record<string, SchemaType>>(shape: T): ObjectSchema<T> {
    return new ObjectSchemaImpl(shape);
  },

  /**
   * Creates a literal schema for exact value matching.
   *
   * @template T - Literal value type
   * @param value - Exact value to match
   * @returns Literal schema
   *
   * @example
   * ```typescript
   * t.literal('admin') // matches only "admin"
   * t.literal(42) // matches only 42
   * t.literal(true) // matches only true
   * ```
   */
  literal<T extends string | number | boolean>(value: T): LiteralSchema<T> {
    return new LiteralSchemaImpl(value);
  },

  /**
   * Creates a union schema for multiple possible types.
   *
   * @template T - Array of possible schema types
   * @param schemas - Schemas to union
   * @returns Union schema
   *
   * @example
   * ```typescript
   * // String or number
   * t.union(t.str(), t.num())
   *
   * // Enum-like literals
   * t.union(
   *   t.literal('admin'),
   *   t.literal('user'),
   *   t.literal('guest')
   * )
   *
   * // Complex types
   * t.union(
   *   t.object({ type: t.literal('user'), name: t.str() }),
   *   t.object({ type: t.literal('guest') })
   * )
   * ```
   */
  union<T extends SchemaType[]>(...schemas: T): UnionSchema<T> {
    return new UnionSchemaImpl(schemas);
  },
};
