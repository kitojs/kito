import type { MiddlewareHandler, RouteHandler } from "./handlers";
import type { MiddlewareDefinition, RouteChain } from "./routes";
import type { SchemaDefinition } from "./schema/base";

// biome-ignore lint/complexity/noBannedTypes: ...
export interface KitoRouterInstance<TExtensions = {}> {
  use(
    middleware: MiddlewareDefinition | MiddlewareHandler,
  ): KitoRouterInstance<TExtensions>;

  mount(
    path: string,
    router: KitoRouterInstance<TExtensions>,
  ): KitoRouterInstance<TExtensions>;

  // biome-ignore lint/complexity/noBannedTypes: ...
  get<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoRouterInstance<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  get<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares:
      | (MiddlewareDefinition | TSchema)[]
      | (MiddlewareDefinition | TSchema),
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoRouterInstance<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  get<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
    schema: TSchema,
  ): KitoRouterInstance<TExtensions>;

  // biome-ignore lint/complexity/noBannedTypes: ...
  post<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoRouterInstance<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  post<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares:
      | (MiddlewareDefinition | TSchema)[]
      | (MiddlewareDefinition | TSchema),
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoRouterInstance<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  post<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
    schema: TSchema,
  ): KitoRouterInstance<TExtensions>;

  // biome-ignore lint/complexity/noBannedTypes: ...
  put<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoRouterInstance<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  put<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares:
      | (MiddlewareDefinition | TSchema)[]
      | (MiddlewareDefinition | TSchema),
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoRouterInstance<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  put<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
    schema: TSchema,
  ): KitoRouterInstance<TExtensions>;

  // biome-ignore lint/complexity/noBannedTypes: ...
  delete<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoRouterInstance<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  delete<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares:
      | (MiddlewareDefinition | TSchema)[]
      | (MiddlewareDefinition | TSchema),
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoRouterInstance<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  delete<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
    schema: TSchema,
  ): KitoRouterInstance<TExtensions>;

  // biome-ignore lint/complexity/noBannedTypes: ...
  patch<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoRouterInstance<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  patch<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares:
      | (MiddlewareDefinition | TSchema)[]
      | (MiddlewareDefinition | TSchema),
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoRouterInstance<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  patch<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
    schema: TSchema,
  ): KitoRouterInstance<TExtensions>;

  // biome-ignore lint/complexity/noBannedTypes: ...
  head<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoRouterInstance<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  head<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares:
      | (MiddlewareDefinition | TSchema)[]
      | (MiddlewareDefinition | TSchema),
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoRouterInstance<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  head<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
    schema: TSchema,
  ): KitoRouterInstance<TExtensions>;

  // biome-ignore lint/complexity/noBannedTypes: ...
  options<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoRouterInstance<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  options<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares:
      | (MiddlewareDefinition | TSchema)[]
      | (MiddlewareDefinition | TSchema),
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoRouterInstance<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  options<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
    schema: TSchema,
  ): KitoRouterInstance<TExtensions>;

  route(path: string): RouteChain<TExtensions>;
  route(
    path: string,
    middlewares: MiddlewareDefinition[] | MiddlewareDefinition,
  ): RouteChain<TExtensions>;
}
