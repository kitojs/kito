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

export interface RouteDefinition {
  method: HttpMethod;
  path: string;
  middlewares: MiddlewareDefinition[];
  handler: RouteHandler;
  schema?: SchemaDefinition;
}

export interface MiddlewareDefinition {
  type: "function" | "schema";
  handler?: MiddlewareHandler;
  schema?: SchemaDefinition;
  global: boolean;
}
