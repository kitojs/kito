import type { MiddlewareHandler, RouteHandler } from "./handlers";
import type { MiddlewareDefinition, RouteChain } from "./routes";
import type { SchemaDefinition } from "./schema/base";

export interface ServerOptions {
  port?: number;
  host?: string;
  unixSocket?: string;
  trustProxy?: boolean;
  maxRequestSize?: number;
  timeout?: number;
}

// biome-ignore lint/complexity/noBannedTypes: ...
export interface KitoServerInstance<TExtensions = {}> {
  use(
    middleware: MiddlewareDefinition | MiddlewareHandler,
  ): KitoServerInstance<TExtensions>;

  // biome-ignore lint/complexity/noBannedTypes: ...
  get<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoServerInstance<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  get<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoServerInstance<TExtensions>;

  // biome-ignore lint/complexity/noBannedTypes: ...
  post<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoServerInstance<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  post<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoServerInstance<TExtensions>;

  // biome-ignore lint/complexity/noBannedTypes: ...
  put<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoServerInstance<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  put<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoServerInstance<TExtensions>;

  // biome-ignore lint/complexity/noBannedTypes: ...
  delete<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoServerInstance<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  delete<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoServerInstance<TExtensions>;

  // biome-ignore lint/complexity/noBannedTypes: ...
  patch<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoServerInstance<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  patch<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoServerInstance<TExtensions>;

  // biome-ignore lint/complexity/noBannedTypes: ...
  head<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoServerInstance<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  head<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoServerInstance<TExtensions>;

  // biome-ignore lint/complexity/noBannedTypes: ...
  options<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoServerInstance<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  options<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoServerInstance<TExtensions>;

  route(path: string): RouteChain<TExtensions>;

  listen(callback?: () => void): Promise<ServerOptions>;
  listen(port?: number, callback?: () => void): Promise<ServerOptions>;
  listen(
    port?: number,
    host?: string,
    callback?: () => void,
  ): Promise<ServerOptions>;
  listen(options: ServerOptions, callback?: () => void): Promise<ServerOptions>;

  close(): void;
}
