import type { MiddlewareHandler, RouteHandler } from "./handlers";
import type { SchemaDefinition } from "./schema/base";

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS"
  | "TRACE";

// biome-ignore lint/complexity/noBannedTypes: ...
export interface RouteDefinition<TSchema extends SchemaDefinition = {}> {
  method: HttpMethod;
  path: string;
  middlewares: MiddlewareDefinition[];
  handler: RouteHandler<TSchema>;
  schema?: TSchema;
}

export interface MiddlewareDefinition {
  type: "function" | "schema";
  handler?: MiddlewareHandler;
  schema?: SchemaDefinition;
  global: boolean;
}
