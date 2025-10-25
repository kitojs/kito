// biome-ignore assist/source/organizeImports: ...
import type {
  HttpMethod,
  MiddlewareDefinition,
  SchemaDefinition,
  ServerOptions,
  RouteHandler,
  MiddlewareHandler,
  KitoContext,
} from "@kitojs/types";

import { ServerCore } from "@kitojs/kito-core";
import { ResponseBuilder } from "./response";

export class KitoServer {
  private globalMiddlewares: MiddlewareDefinition[] = [];
  private serverOptions: ServerOptions = {};

  private coreServer: ServerCore;

  constructor(options?: ServerOptions) {
    this.serverOptions = { ...this.serverOptions, ...options };
    this.coreServer = new ServerCore({
      port: 3000,
      host: "0.0.0.0",
      ...options,
    });
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
    //let routeSchema: TSchema | undefined;

    for (const item of middlewares) {
      if (this.isSchemaDefinition(item)) {
        //routeSchema = item as TSchema;
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

    const fusedHandler = this.fuseMiddlewares(
      this.globalMiddlewares,
      routeMiddlewares,
      finalHandler,
    );

    const routeHandler = async (ctx: KitoContext<TSchema>) => {
      const resBuilder = new ResponseBuilder(ctx.res);
      const context = { ...ctx, res: resBuilder };

      await fusedHandler(context);
    };

    const rd = {
      method,
      path,
      handler: routeHandler,
      //schema: routeSchema,
    };

    this.coreServer.addRoute(rd);
  }

  private fuseMiddlewares<TSchema>(
    globals: MiddlewareDefinition[],
    routeMiddlewares: MiddlewareDefinition[],
    handler: RouteHandler<TSchema>,
  ): RouteHandler<TSchema> {
    const functions = [
      ...globals
        .filter((m) => m.type === "function" && m.handler)
        // biome-ignore lint/style/noNonNullAssertion: ...
        .map((m) => m.handler!),
      ...routeMiddlewares
        .filter((m) => m.type === "function" && m.handler)
        // biome-ignore lint/style/noNonNullAssertion: ...
        .map((m) => m.handler!),
    ];

    if (functions.length === 0) return handler;

    // biome-ignore lint/suspicious/noExplicitAny: ...
    return async (ctx: any) => {
      let i = 0;
      // biome-ignore lint/suspicious/noExplicitAny: ...
      const next = async (): Promise<any> => {
        if (i < functions.length) {
          const fn = functions[i++];
          return fn(ctx, next);
        } else {
          return handler(ctx);
        }
      };
      return next();
    };
  }

  // biome-ignore lint/suspicious/noExplicitAny: ...
  private isSchemaDefinition(item: any): item is SchemaDefinition {
    return item && (item.params || item.query || item.body || item.headers);
  }

  async listen(port?: number, host?: string): Promise<void> {
    const finalPort = port ?? this.serverOptions.port ?? 3000;
    const finalHost = host ?? this.serverOptions.host ?? "0.0.0.0";

    const configuration = {
      port: finalPort,
      host: finalHost,
      ...this.serverOptions,
    };

    console.log("config: ", JSON.stringify(configuration, null, 2));

    this.coreServer.setConfig(configuration);
    await this.coreServer.start();
  }
}

export function server(options?: ServerOptions): KitoServer {
  return new KitoServer(options);
}
