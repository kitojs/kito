import type { MiddlewareHandler, RouteHandler } from "./handlers";
import type { SchemaDefinition } from "./schema/base";
import type { KitoServerInstance } from "./server";

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
  handler: RouteHandler<TSchema>;
  schema?: TSchema;
}

export interface MiddlewareDefinition {
  type: "function" | "schema";
  handler?: MiddlewareHandler;
  schema?: SchemaDefinition;
  global: boolean;
}

// biome-ignore lint/complexity/noBannedTypes: ...
export type RouteChain<TExtensions = {}> = {
  // biome-ignore lint/complexity/noBannedTypes: ...
  get<TSchema extends SchemaDefinition = {}>(
    handler: RouteHandler<TSchema, TExtensions>,
  ): RouteChain<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  get<TSchema extends SchemaDefinition = {}>(
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): RouteChain<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  get<TSchema extends SchemaDefinition = {}>(
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handler?: RouteHandler<TSchema, TExtensions>,
  ): RouteChain<TExtensions>;

  // biome-ignore lint/complexity/noBannedTypes: ...
  post<TSchema extends SchemaDefinition = {}>(
    handler: RouteHandler<TSchema, TExtensions>,
  ): RouteChain<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  post<TSchema extends SchemaDefinition = {}>(
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): RouteChain<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  post<TSchema extends SchemaDefinition = {}>(
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handler?: RouteHandler<TSchema, TExtensions>,
  ): RouteChain<TExtensions>;

  // biome-ignore lint/complexity/noBannedTypes: ...
  put<TSchema extends SchemaDefinition = {}>(
    handler: RouteHandler<TSchema, TExtensions>,
  ): RouteChain<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  put<TSchema extends SchemaDefinition = {}>(
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): RouteChain<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  put<TSchema extends SchemaDefinition = {}>(
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handler?: RouteHandler<TSchema, TExtensions>,
  ): RouteChain<TExtensions>;

  // biome-ignore lint/complexity/noBannedTypes: ...
  delete<TSchema extends SchemaDefinition = {}>(
    handler: RouteHandler<TSchema, TExtensions>,
  ): RouteChain<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  delete<TSchema extends SchemaDefinition = {}>(
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): RouteChain<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  delete<TSchema extends SchemaDefinition = {}>(
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handler?: RouteHandler<TSchema, TExtensions>,
  ): RouteChain<TExtensions>;

  // biome-ignore lint/complexity/noBannedTypes: ...
  patch<TSchema extends SchemaDefinition = {}>(
    handler: RouteHandler<TSchema, TExtensions>,
  ): RouteChain<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  patch<TSchema extends SchemaDefinition = {}>(
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): RouteChain<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  patch<TSchema extends SchemaDefinition = {}>(
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handler?: RouteHandler<TSchema, TExtensions>,
  ): RouteChain<TExtensions>;

  // biome-ignore lint/complexity/noBannedTypes: ...
  head<TSchema extends SchemaDefinition = {}>(
    handler: RouteHandler<TSchema, TExtensions>,
  ): RouteChain<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  head<TSchema extends SchemaDefinition = {}>(
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): RouteChain<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  head<TSchema extends SchemaDefinition = {}>(
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handler?: RouteHandler<TSchema, TExtensions>,
  ): RouteChain<TExtensions>;

  // biome-ignore lint/complexity/noBannedTypes: ...
  options<TSchema extends SchemaDefinition = {}>(
    handler: RouteHandler<TSchema, TExtensions>,
  ): RouteChain<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  options<TSchema extends SchemaDefinition = {}>(
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): RouteChain<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  options<TSchema extends SchemaDefinition = {}>(
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handler?: RouteHandler<TSchema, TExtensions>,
  ): RouteChain<TExtensions>;

  end(): KitoServerInstance<TExtensions>;
};
