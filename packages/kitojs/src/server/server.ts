// biome-ignore assist/source/organizeImports: ...
import type {
  HttpMethod,
  RouteDefinition,
  MiddlewareDefinition,
  SchemaDefinition,
  ServerOptions,
  ServerConfiguration,
  RouteHandler,
  MiddlewareHandler,
} from "@kitojs/types";

export class KitoServer {
  private routes: RouteDefinition[] = [];
  private globalMiddlewares: MiddlewareDefinition[] = [];
  private serverOptions: ServerOptions = {};

  constructor(options?: ServerOptions) {
    this.serverOptions = { ...this.serverOptions, ...options };
  }

  use(middleware: MiddlewareDefinition | MiddlewareHandler): void {
    if (typeof middleware === "function") {
      this.globalMiddlewares.push({
        type: "function",
        handler: middleware,
        global: true,
      });
    } else {
      this.globalMiddlewares.push({
        ...middleware,
        global: true,
      });
    }
  }

  get<TSchema = unknown>(path: string, handler: RouteHandler<TSchema>): void;
  get<TSchema = unknown>(
    path: string,
    middlewares: (MiddlewareDefinition | SchemaDefinition)[],
    handler: RouteHandler<TSchema>,
  ): void;
  get<TSchema = unknown>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | SchemaDefinition)[]
      | RouteHandler<TSchema>,
    handler?: RouteHandler<TSchema>,
  ): void {
    this.addRoute("GET", path, middlewaresOrHandler, handler);
  }

  post<TSchema = unknown>(path: string, handler: RouteHandler<TSchema>): void;
  post<TSchema = unknown>(
    path: string,
    middlewares: (MiddlewareDefinition | SchemaDefinition)[],
    handler: RouteHandler<TSchema>,
  ): void;
  post<TSchema = unknown>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | SchemaDefinition)[]
      | RouteHandler<TSchema>,
    handler?: RouteHandler<TSchema>,
  ): void {
    this.addRoute("POST", path, middlewaresOrHandler, handler);
  }

  put<TSchema = unknown>(path: string, handler: RouteHandler<TSchema>): void;
  put<TSchema = unknown>(
    path: string,
    middlewares: (MiddlewareDefinition | SchemaDefinition)[],
    handler: RouteHandler<TSchema>,
  ): void;
  put<TSchema = unknown>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | SchemaDefinition)[]
      | RouteHandler<TSchema>,
    handler?: RouteHandler<TSchema>,
  ): void {
    this.addRoute("PUT", path, middlewaresOrHandler, handler);
  }

  delete<TSchema = unknown>(path: string, handler: RouteHandler<TSchema>): void;
  delete<TSchema = unknown>(
    path: string,
    middlewares: (MiddlewareDefinition | SchemaDefinition)[],
    handler: RouteHandler<TSchema>,
  ): void;
  delete<TSchema = unknown>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | SchemaDefinition)[]
      | RouteHandler<TSchema>,
    handler?: RouteHandler<TSchema>,
  ): void {
    this.addRoute("DELETE", path, middlewaresOrHandler, handler);
  }

  patch<TSchema = unknown>(path: string, handler: RouteHandler<TSchema>): void;
  patch<TSchema = unknown>(
    path: string,
    middlewares: (MiddlewareDefinition | SchemaDefinition)[],
    handler: RouteHandler<TSchema>,
  ): void;
  patch<TSchema = unknown>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | SchemaDefinition)[]
      | RouteHandler<TSchema>,
    handler?: RouteHandler<TSchema>,
  ): void {
    this.addRoute("PATCH", path, middlewaresOrHandler, handler);
  }

  head<TSchema = unknown>(path: string, handler: RouteHandler<TSchema>): void;
  head<TSchema = unknown>(
    path: string,
    middlewares: (MiddlewareDefinition | SchemaDefinition)[],
    handler: RouteHandler<TSchema>,
  ): void;
  head<TSchema = unknown>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | SchemaDefinition)[]
      | RouteHandler<TSchema>,
    handler?: RouteHandler<TSchema>,
  ): void {
    this.addRoute("HEAD", path, middlewaresOrHandler, handler);
  }

  options<TSchema = unknown>(
    path: string,
    handler: RouteHandler<TSchema>,
  ): void;
  options<TSchema = unknown>(
    path: string,
    middlewares: (MiddlewareDefinition | SchemaDefinition)[],
    handler: RouteHandler<TSchema>,
  ): void;
  options<TSchema = unknown>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | SchemaDefinition)[]
      | RouteHandler<TSchema>,
    handler?: RouteHandler<TSchema>,
  ): void {
    this.addRoute("OPTIONS", path, middlewaresOrHandler, handler);
  }

  private addRoute<TSchema = unknown>(
    method: HttpMethod,
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | SchemaDefinition)[]
      | RouteHandler<TSchema>,
    handler?: RouteHandler<TSchema>,
  ): void {
    let finalHandler: RouteHandler<TSchema>;
    let middlewares: (MiddlewareDefinition | SchemaDefinition)[] = [];

    if (typeof middlewaresOrHandler === "function") {
      finalHandler = middlewaresOrHandler;
    } else {
      middlewares = middlewaresOrHandler;
      // biome-ignore lint/style/noNonNullAssertion: ...
      finalHandler = handler!;
    }

    const routeMiddlewares: MiddlewareDefinition[] = [];
    let routeSchema: SchemaDefinition | undefined;

    for (const item of middlewares) {
      if (this.isSchemaDefinition(item)) {
        routeSchema = item;
        routeMiddlewares.push({
          type: "schema",
          schema: item,
          global: false,
        });
      } else {
        routeMiddlewares.push({
          ...item,
          global: false,
        });
      }
    }

    this.routes.push({
      method,
      path,
      middlewares: routeMiddlewares,
      handler: finalHandler as RouteHandler,
      schema: routeSchema,
    });
  }

  // biome-ignore lint/suspicious/noExplicitAny: ...
  private isSchemaDefinition(item: any): item is SchemaDefinition {
    return item && (item.params || item.query || item.body || item.headers);
  }

  async listen(port?: number, host?: string): Promise<void> {
    const finalPort = port ?? this.serverOptions.port ?? 3000;
    const finalHost = host ?? this.serverOptions.host ?? "0.0.0.0";

    const configuration: ServerConfiguration = {
      routes: this.routes,
      middlewares: this.globalMiddlewares,
      config: {
        ...this.serverOptions,
        port: finalPort,
        host: finalHost,
      },
    };

    const serializedConfig = this.serializeConfiguration(configuration);

    console.log("config: ", JSON.stringify(serializedConfig, null, 2));

    // to-do: start server from core
  }

  // biome-ignore lint/suspicious/noExplicitAny: ...
  private serializeConfiguration(config: ServerConfiguration): any {
    return {
      routes: config.routes.map((route) => ({
        method: route.method,
        path: route.path,
        middlewares: route.middlewares.map((m) => ({
          type: m.type,
          global: m.global,
          schema: m.schema ? this.serializeSchema(m.schema) : undefined,
        })),
        schema: route.schema ? this.serializeSchema(route.schema) : undefined,
      })),
      middlewares: config.middlewares.map((m) => ({
        type: m.type,
        global: m.global,
        schema: m.schema ? this.serializeSchema(m.schema) : undefined,
      })),
      config: config.config,
    };
  }

  // biome-ignore lint/suspicious/noExplicitAny: ...
  private serializeSchema(schema: SchemaDefinition): any {
    // biome-ignore lint/suspicious/noExplicitAny: ...
    const result: any = {};

    if (schema.params) {
      // biome-ignore lint/suspicious/noExplicitAny: ...
      result.params = (schema.params as any)._serialize();
    }
    if (schema.query) {
      // biome-ignore lint/suspicious/noExplicitAny: ...
      result.query = (schema.query as any)._serialize();
    }
    if (schema.body) {
      // biome-ignore lint/suspicious/noExplicitAny: ...
      result.body = (schema.body as any)._serialize();
    }
    if (schema.headers) {
      // biome-ignore lint/suspicious/noExplicitAny: ...
      result.headers = (schema.headers as any)._serialize();
    }

    return result;
  }
}

export function server(options?: ServerOptions): KitoServer {
  return new KitoServer(options);
}
