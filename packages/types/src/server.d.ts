import type { MiddlewareHandler, RouteHandler } from "./handlers";
import type { MiddlewareDefinition, RouteChain } from "./routes";
import type { SchemaDefinition } from "./schema/base";
import type { KitoRouterInstance } from "./router";

export interface ServerOptions {
  port?: number;
  host?: string;
  unixSocket?: string;
  trustProxy?: boolean;
  maxRequestSize?: number;
  timeout?: number;
  reusePort?: boolean;
}

// biome-ignore lint/complexity/noBannedTypes: ...
export interface KitoServerInstance<TExtensions = {}>
  extends KitoRouterInstance<TExtensions> {
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
