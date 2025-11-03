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

import { ServerCore, type ServerOptionsCore } from "@kitojs/kito-core";
import { RequestBuilder } from "./request";
import { ResponseBuilder } from "./response";

// biome-ignore lint/complexity/noBannedTypes: ...
export class KitoServer<TExtensions = {}> {
  private globalMiddlewares: MiddlewareDefinition[] = [];
  private serverOptions: ServerOptions = {};

  private coreServer: ServerCore;
  // biome-ignore lint/suspicious/noExplicitAny: ...
  private extensionFn?: (ctx: any) => void;

  constructor(options?: ServerOptions) {
    this.serverOptions = { ...this.serverOptions, ...options };
    this.coreServer = new ServerCore({
      port: 3000,
      host: "0.0.0.0",
      ...options,
    });
  }

  extend<TNewExtensions = unknown>(
    fn: (
      ctx: KitoContext & TExtensions & Partial<TNewExtensions>,
      // biome-ignore lint/suspicious/noConfusingVoidType: ...
    ) => TNewExtensions | void,
  ): KitoServer<TExtensions & TNewExtensions> {
    const newServer = new KitoServer<TExtensions & TNewExtensions>(
      this.serverOptions,
    );

    newServer.globalMiddlewares = [...this.globalMiddlewares];

    newServer.coreServer = this.coreServer;

    const previousExtensionFn = this.extensionFn;
    // biome-ignore lint/suspicious/noExplicitAny: ...
    newServer.extensionFn = (ctx: any) => {
      if (previousExtensionFn) {
        previousExtensionFn(ctx);
      }

      const result = fn(ctx);
      if (result && typeof result === "object") {
        Object.assign(ctx, result);
      }
    };

    return newServer;
  }

  use(middleware: MiddlewareDefinition | MiddlewareHandler): void {
    if (typeof middleware === "function") {
      this.globalMiddlewares.push({
        type: "function",
        handler: middleware,
        global: true,
      });
    } else {
      this.globalMiddlewares.push({ ...middleware, global: true });
    }
  }

  // biome-ignore lint/complexity/noBannedTypes: ...
  get<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): void;
  // biome-ignore lint/complexity/noBannedTypes: ...
  get<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): void;
  // biome-ignore lint/complexity/noBannedTypes: ...
  get<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handler?: RouteHandler<TSchema, TExtensions>,
  ): void {
    this.addRoute<TSchema>("GET", path, middlewaresOrHandler, handler);
  }

  // biome-ignore lint/complexity/noBannedTypes: ...
  post<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): void;
  // biome-ignore lint/complexity/noBannedTypes: ...
  post<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): void;
  // biome-ignore lint/complexity/noBannedTypes: ...
  post<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handler?: RouteHandler<TSchema, TExtensions>,
  ): void {
    this.addRoute<TSchema>("POST", path, middlewaresOrHandler, handler);
  }

  // biome-ignore lint/complexity/noBannedTypes: ...
  put<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): void;
  // biome-ignore lint/complexity/noBannedTypes: ...
  put<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): void;
  // biome-ignore lint/complexity/noBannedTypes: ...
  put<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handler?: RouteHandler<TSchema, TExtensions>,
  ): void {
    this.addRoute<TSchema>("PUT", path, middlewaresOrHandler, handler);
  }

  // biome-ignore lint/complexity/noBannedTypes: ...
  delete<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): void;
  // biome-ignore lint/complexity/noBannedTypes: ...
  delete<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): void;
  // biome-ignore lint/complexity/noBannedTypes: ...
  delete<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handler?: RouteHandler<TSchema, TExtensions>,
  ): void {
    this.addRoute<TSchema>("DELETE", path, middlewaresOrHandler, handler);
  }

  // biome-ignore lint/complexity/noBannedTypes: ...
  patch<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): void;
  // biome-ignore lint/complexity/noBannedTypes: ...
  patch<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): void;
  // biome-ignore lint/complexity/noBannedTypes: ...
  patch<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handler?: RouteHandler<TSchema, TExtensions>,
  ): void {
    this.addRoute<TSchema>("PATCH", path, middlewaresOrHandler, handler);
  }

  // biome-ignore lint/complexity/noBannedTypes: ...
  head<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): void;
  // biome-ignore lint/complexity/noBannedTypes: ...
  head<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): void;
  // biome-ignore lint/complexity/noBannedTypes: ...
  head<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handler?: RouteHandler<TSchema, TExtensions>,
  ): void {
    this.addRoute<TSchema>("HEAD", path, middlewaresOrHandler, handler);
  }

  // biome-ignore lint/complexity/noBannedTypes: ...
  options<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): void;
  // biome-ignore lint/complexity/noBannedTypes: ...
  options<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): void;
  // biome-ignore lint/complexity/noBannedTypes: ...
  options<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handler?: RouteHandler<TSchema, TExtensions>,
  ): void {
    this.addRoute<TSchema>("OPTIONS", path, middlewaresOrHandler, handler);
  }

  // biome-ignore lint/complexity/noBannedTypes: ...
  private addRoute<TSchema extends SchemaDefinition = {}>(
    method: HttpMethod,
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handler?: RouteHandler<TSchema, TExtensions>,
  ): void {
    let finalHandler: RouteHandler<TSchema, TExtensions>;
    let middlewares: (MiddlewareDefinition | TSchema)[] = [];

    if (typeof middlewaresOrHandler === "function") {
      finalHandler = middlewaresOrHandler as RouteHandler<TSchema, TExtensions>;
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
      const reqBuilder = new RequestBuilder(ctx.req);
      const resBuilder = new ResponseBuilder(ctx.res);

      // biome-ignore lint/suspicious/noExplicitAny: ...
      const context: any = { req: reqBuilder, res: resBuilder };

      if (this.extensionFn) {
        this.extensionFn(context);
      }

      await fusedHandler(context);
    };

    this.coreServer.addRoute({ method, path, handler: routeHandler });
  }

  private fuseMiddlewares<TSchema extends SchemaDefinition>(
    globals: MiddlewareDefinition[],
    routeMiddlewares: MiddlewareDefinition[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): RouteHandler<TSchema, TExtensions> {
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

    if (functions.length === 0)
      return handler as RouteHandler<TSchema, TExtensions>;

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

  async listen(
    portOrCallback?: number | (() => void),
    hostOrCallback?: string | (() => void),
    maybeCallback?: () => void,
  ): Promise<ServerOptionsCore> {
    let port: number | undefined;
    let host: string | undefined;
    let ready: (() => void) | undefined;

    if (typeof portOrCallback === "function") {
      ready = portOrCallback;
    } else {
      port = portOrCallback;
      if (typeof hostOrCallback === "function") {
        ready = hostOrCallback;
      } else {
        host = hostOrCallback;
        ready = maybeCallback;
      }
    }

    const finalPort = port ?? this.serverOptions.port ?? 3000;
    const finalHost = host ?? this.serverOptions.host ?? "0.0.0.0";

    const configuration: ServerOptionsCore = {
      port: finalPort,
      host: finalHost,
      ...this.serverOptions,
    };

    this.coreServer.setConfig(configuration);
    await this.coreServer.start(ready);

    return configuration;
  }

  close(): void {
    this.coreServer.close();
  }
}

// biome-ignore lint/complexity/noBannedTypes: ...
export function server(options?: ServerOptions): KitoServer<{}> {
  return new KitoServer(options);
}
