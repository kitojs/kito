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
  // biome-ignore lint/suspicious/noExplicitAny: ...
  private routes: RouteDefinition<any>[] = [];
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

  // biome-ignore lint/complexity/noBannedTypes: ...
  get<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema>,
  ): void;
  // biome-ignore lint/complexity/noBannedTypes: ...
  get<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema>,
  ): void;
  // biome-ignore lint/complexity/noBannedTypes: ...
  get<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema>,
    handler?: RouteHandler<TSchema>,
  ): void {
    this.addRoute<TSchema>("GET", path, middlewaresOrHandler, handler);
  }

  // biome-ignore lint/complexity/noBannedTypes: ...
  post<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema>,
  ): void;
  // biome-ignore lint/complexity/noBannedTypes: ...
  post<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema>,
  ): void;
  // biome-ignore lint/complexity/noBannedTypes: ...
  post<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema>,
    handler?: RouteHandler<TSchema>,
  ): void {
    this.addRoute<TSchema>("POST", path, middlewaresOrHandler, handler);
  }

  // biome-ignore lint/complexity/noBannedTypes: ...
  put<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema>,
  ): void;
  // biome-ignore lint/complexity/noBannedTypes: ...
  put<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema>,
  ): void;
  // biome-ignore lint/complexity/noBannedTypes: ...
  put<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema>,
    handler?: RouteHandler<TSchema>,
  ): void {
    this.addRoute<TSchema>("PUT", path, middlewaresOrHandler, handler);
  }

  // biome-ignore lint/complexity/noBannedTypes: ...
  delete<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema>,
  ): void;
  // biome-ignore lint/complexity/noBannedTypes: ...
  delete<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema>,
  ): void;
  // biome-ignore lint/complexity/noBannedTypes: ...
  delete<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema>,
    handler?: RouteHandler<TSchema>,
  ): void {
    this.addRoute<TSchema>("DELETE", path, middlewaresOrHandler, handler);
  }

  // biome-ignore lint/complexity/noBannedTypes: ...
  patch<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema>,
  ): void;
  // biome-ignore lint/complexity/noBannedTypes: ...
  patch<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema>,
  ): void;
  // biome-ignore lint/complexity/noBannedTypes: ...
  patch<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema>,
    handler?: RouteHandler<TSchema>,
  ): void {
    this.addRoute<TSchema>("PATCH", path, middlewaresOrHandler, handler);
  }

  // biome-ignore lint/complexity/noBannedTypes: ...
  head<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema>,
  ): void;
  // biome-ignore lint/complexity/noBannedTypes: ...
  head<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema>,
  ): void;
  // biome-ignore lint/complexity/noBannedTypes: ...
  head<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema>,
    handler?: RouteHandler<TSchema>,
  ): void {
    this.addRoute<TSchema>("HEAD", path, middlewaresOrHandler, handler);
  }

  // biome-ignore lint/complexity/noBannedTypes: ...
  options<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema>,
  ): void;
  // biome-ignore lint/complexity/noBannedTypes: ...
  options<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema>,
  ): void;
  // biome-ignore lint/complexity/noBannedTypes: ...
  options<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema>,
    handler?: RouteHandler<TSchema>,
  ): void {
    this.addRoute<TSchema>("OPTIONS", path, middlewaresOrHandler, handler);
  }

  // biome-ignore lint/complexity/noBannedTypes: ...
  private addRoute<TSchema extends SchemaDefinition = {}>(
    method: HttpMethod,
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema>,
    handler?: RouteHandler<TSchema>,
  ): void {
    let finalHandler: RouteHandler<TSchema>;
    let middlewares: (MiddlewareDefinition | TSchema)[] = [];

    if (typeof middlewaresOrHandler === "function") {
      finalHandler = middlewaresOrHandler as RouteHandler<TSchema>;
    } else {
      middlewares = middlewaresOrHandler as (MiddlewareDefinition | TSchema)[];
      // biome-ignore lint/style/noNonNullAssertion: ...
      finalHandler = handler!;
    }

    const routeMiddlewares: MiddlewareDefinition[] = [];
    let routeSchema: TSchema | undefined;

    for (const item of middlewares) {
      if (this.isSchemaDefinition(item)) {
        routeSchema = item as TSchema;
        routeMiddlewares.push({
          type: "schema",
          // biome-ignore lint/suspicious/noExplicitAny: ...
          schema: item as any,
          global: false,
        });
      } else {
        routeMiddlewares.push({
          ...(item as MiddlewareDefinition),
          global: false,
        });
      }
    }

    const rd: RouteDefinition<TSchema> = {
      method,
      path,
      middlewares: routeMiddlewares,
      handler: finalHandler,
      schema: routeSchema,
    };

    // biome-ignore lint/suspicious/noExplicitAny: ...
    this.routes.push(rd as RouteDefinition<any>);
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
