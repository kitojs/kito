import type { MiddlewareDefinition, RouteDefinition } from "./routes";

export interface ServerConfiguration {
  routes: RouteDefinition[];
  middlewares: MiddlewareDefinition[];
  config: ServerOptions;
}

export interface ServerOptions {
  port?: number;
  host?: string;
  trustProxy?: boolean;
  maxRequestSize?: number;
  timeout?: number;
}
