// biome-ignore assist/source/organizeImports: ...
import type {
  HttpMethod,
  MiddlewareDefinition,
  SchemaDefinition,
  ServerOptions,
  RouteHandler,
  KitoContext,
  KitoServerInstance,
} from "@kitojs/types";

import { ServerCore, type ServerOptionsCore } from "@kitojs/kito-core";
import { RequestBuilder } from "./request";
import { ResponseBuilder } from "./response";

import { analyzeHandler, type StaticResponseType } from "./analyzer";
import { KitoRouter } from "./router";

/**
 * Main server class for Kito framework.
 * Extends Router to provide HTTP routing, middleware support, and adds server-specific functionality.
 *
 * @template TExtensions - Type of custom extensions added to the context
 *
 * @example
 * ```typescript
 * const app = new KitoServer();
 *
 * app.get('/', ctx => {
 *   ctx.res.send('Hello World!');
 * });
 *
 * app.listen(3000);
 * ```
 */
// biome-ignore lint/complexity/noBannedTypes: ...
export class KitoServer<TExtensions = {}>
  extends KitoRouter<TExtensions>
  implements KitoServerInstance<TExtensions>
{
  private serverOptions: ServerOptions = {};

  private coreServer: ServerCore;
  // biome-ignore lint/suspicious/noExplicitAny: ...
  private extensionFn?: (ctx: any) => void;

  /**
   * Creates a new Kito server instance.
   *
   * @param options - Server configuration options
   * @param options.port - Port to listen on (default: 3000)
   * @param options.host - Host to bind to (default: "0.0.0.0")
   * @param options.trustProxy - Trust X-Forwarded-* headers
   * @param options.maxRequestSize - Maximum request body size in bytes
   * @param options.timeout - Request timeout in milliseconds
   */
  constructor(options?: ServerOptions) {
    super();
    this.serverOptions = { ...this.serverOptions, ...options };
    this.coreServer = new ServerCore({
      port: options?.unixSocket ? undefined : options?.port,
      host: options?.unixSocket ? undefined : options?.host,
      unixSocket: options?.unixSocket,
      reusePort: options?.reusePort,
      trustProxy: options?.trustProxy,
      maxRequestSize: options?.maxRequestSize,
      timeout: options?.timeout,
    });
  }

  /**
   * Extends the request context with custom properties or methods.
   *
   * @template TNewExtensions - Type of the new extensions
   * @param fn - Function that adds extensions to the context
   * @returns A new server instance with extended context type
   *
   * @example
   * ```typescript
   * interface Database {
   *   query: (sql: string) => Promise<any>;
   * }
   *
   * const app = server().extend<{ db: Database }>(ctx => {
   *   ctx.db = createDatabase();
   * });
   *
   * app.get('/users', ctx => {
   *   const users = await ctx.db.query('SELECT * FROM users');
   *   ctx.res.json(users);
   * });
   * ```
   */
  extend<TNewExtensions = unknown>(
    fn: (
      ctx: KitoContext & TExtensions & Partial<TNewExtensions>,
      // biome-ignore lint/suspicious/noConfusingVoidType: ...
    ) => TNewExtensions | void,
  ): KitoServer<TExtensions & TNewExtensions> {
    const newServer = new KitoServer<TExtensions & TNewExtensions>(
      this.serverOptions,
    );

    newServer.middlewares = [...this.middlewares];
    newServer.routes = [...this.routes];

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

  // biome-ignore lint/complexity/noBannedTypes: ...
  protected override addRoute<TSchema extends SchemaDefinition = {}>(
    method: HttpMethod,
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handler?: RouteHandler<TSchema, TExtensions>,
  ): void {
    super.addRoute(method, path, middlewaresOrHandler, handler);

    const route = this.routes[this.routes.length - 1];

    this.registerRouteWithCore(route);
  }

  override mount(path: string, router: KitoRouter<TExtensions>): this {
    const routesToMount = (router as KitoRouter<TExtensions>)["routes"];

    super.mount(path, router);
    const normalizedPath = this["normalizePath"](path);

    for (const route of routesToMount) {
      const prefixedRoute = {
        ...route,
        path: normalizedPath + route.path,
      };
      this.registerRouteWithCore(prefixedRoute);
    }

    return this;
  }

  private registerRouteWithCore(
    // biome-ignore lint/suspicious/noExplicitAny: ...
    route: any,
  ): void {
    let finalHandler: RouteHandler<SchemaDefinition, TExtensions>;
    let middlewares: (MiddlewareDefinition | SchemaDefinition)[] = [];

    finalHandler = route.handler;
    middlewares = route.middlewares || [];

    const routeMiddlewares: MiddlewareDefinition[] = [];
    let routeSchema: SchemaDefinition | undefined;

    for (const item of middlewares) {
      if (this.isSchemaDefinition(item)) {
        routeSchema = item as SchemaDefinition;
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

    let staticResponse: StaticResponseType = { type: "none" };

    if (this.middlewares.length === 0 && routeMiddlewares.length === 0) {
      staticResponse = analyzeHandler(finalHandler);
    }

    const fusedHandler = this.fuseMiddlewares(
      this.middlewares,
      routeMiddlewares,
      finalHandler,
    );

    const routeHandler = async (ctx: KitoContext<SchemaDefinition>) => {
      const reqBuilder = new RequestBuilder(ctx.req);
      const resBuilder = new ResponseBuilder(ctx.res);

      // biome-ignore lint/suspicious/noExplicitAny: ...
      const context: any = { req: reqBuilder, res: resBuilder };

      if (this.extensionFn) {
        this.extensionFn(context);
      }

      await fusedHandler(context);
    };

    const schemaJson = routeSchema
      ? this.serializeSchema(routeSchema)
      : undefined;

    const staticResponseJson =
      staticResponse.type !== "none"
        ? JSON.stringify(staticResponse)
        : undefined;

    this.coreServer.addRoute({
      method: route.method,
      path: route.path,
      handler: routeHandler,
      schema: schemaJson,
      staticResponse: staticResponseJson,
    });
  }

  private serializeSchema(schema: SchemaDefinition): string {
    // biome-ignore lint/suspicious/noExplicitAny: ...
    const serialized: any = {};

    if (schema.params) {
      // biome-ignore lint/suspicious/noExplicitAny: ...
      serialized.params = (schema.params as any)._serialize();
    }
    if (schema.query) {
      // biome-ignore lint/suspicious/noExplicitAny: ...
      serialized.query = (schema.query as any)._serialize();
    }
    if (schema.body) {
      // biome-ignore lint/suspicious/noExplicitAny: ...
      serialized.body = (schema.body as any)._serialize();
    }
    if (schema.headers) {
      // biome-ignore lint/suspicious/noExplicitAny: ...
      serialized.headers = (schema.headers as any)._serialize();
    }

    return JSON.stringify(serialized);
  }

  private registerCatchAllRoute(): void {
    const hasCatchAll = this.routes.some(
      (route) =>
        route.path === "{*path}" || route.path === "/*" || route.path === "*",
    );

    if (hasCatchAll) return;

    const catchAllHandler: RouteHandler<SchemaDefinition, TExtensions> = (
      ctx,
    ) => {
      try {
        ctx.res.status(404).send("Not Found");
      } catch {}
    };

    const fusedHandler = this.fuseMiddlewares(
      this.middlewares,
      [],
      catchAllHandler,
    );

    const routeHandler = async (ctx: KitoContext<SchemaDefinition>) => {
      const reqBuilder = new RequestBuilder(ctx.req);
      const resBuilder = new ResponseBuilder(ctx.res);

      // biome-ignore lint/suspicious/noExplicitAny: ...
      const context: any = { req: reqBuilder, res: resBuilder };

      if (this.extensionFn) {
        this.extensionFn(context);
      }

      await fusedHandler(context);
    };

    const methods: HttpMethod[] = [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "PATCH",
      "HEAD",
      "OPTIONS",
    ];

    for (const method of methods) {
      this.coreServer.addRoute({
        method,
        path: "{*path}",
        handler: routeHandler,
        schema: undefined,
        staticResponse: undefined,
      });
    }
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

  /**
   * Starts the server.
   *
   * You can call `listen` in multiple ways:
   *
   * **1. Using a port (classic usage)**
   * ```ts
   * app.listen(3000);
   * app.listen(3000, "0.0.0.0");
   * app.listen(3000, () => console.log("Ready"));
   * app.listen(3000, "0.0.0.0", () => console.log("Ready"));
   * ```
   *
   * **2. Using an options object**
   * ```ts
   * app.listen({
   *   port: 3000,
   *   host: "0.0.0.0",
   * });
   * ```
   *
   * **3. Listening on a Unix Domain Socket**
   * ```ts
   * app.listen({
   *   unixSocket: "/tmp/kito.sock",
   * });
   * ```
   *
   * When `unixSocket` is provided:
   * - `port` and `host` are ignored
   * - The server binds exclusively to the provided socket path
   *
   * You may also pass a callback as the last argument in all forms.
   *
   * @param portOrCallbackOrOptions Port number, callback, or a full `ServerOptions` object.
   * @param hostOrCallback Hostname or callback.
   * @param maybeCallback Optional callback executed once the server starts.
   * @returns The resolved server configuration.
   */
  async listen(
    portOrCallbackOrOptions?: number | (() => void) | ServerOptions,
    hostOrCallback?: string | (() => void),
    maybeCallback?: () => void,
  ): Promise<ServerOptionsCore> {
    let port: number | undefined;
    let host: string | undefined;
    let unixSocket: string | undefined;
    let reusePort: boolean | undefined;
    let ready: (() => void) | undefined;

    if (typeof portOrCallbackOrOptions === "object") {
      const options = portOrCallbackOrOptions;
      port = options.port;
      host = options.host;
      unixSocket = options.unixSocket;
      reusePort = options.reusePort;
      ready = hostOrCallback as (() => void) | undefined;
    } else if (typeof portOrCallbackOrOptions === "function") {
      ready = portOrCallbackOrOptions;
    } else {
      port = portOrCallbackOrOptions;
      if (typeof hostOrCallback === "function") {
        ready = hostOrCallback;
      } else {
        host = hostOrCallback;
        ready = maybeCallback;
      }
    }

    const finalUnixSocket = unixSocket ?? this.serverOptions.unixSocket;
    const finalReusePort = reusePort ?? this.serverOptions.reusePort ?? false;
    const finalPort = finalUnixSocket
      ? undefined
      : (port ?? this.serverOptions.port ?? 3000);
    const finalHost = finalUnixSocket
      ? undefined
      : (host ?? this.serverOptions.host ?? "0.0.0.0");

    if (this.middlewares.length > 0) {
      this.registerCatchAllRoute();
    }

    const configuration: ServerOptionsCore = {
      port: finalPort,
      host: finalHost,
      unixSocket: finalUnixSocket,
      reusePort: finalReusePort,
      trustProxy: this.serverOptions.trustProxy,
      maxRequestSize: this.serverOptions.maxRequestSize,
      timeout: this.serverOptions.timeout,
    };

    this.coreServer.setConfig(configuration);
    await this.coreServer.start(ready);

    return configuration;
  }

  /**
   * Closes the server and stops accepting new connections.
   */
  close(): void {
    this.coreServer.close();
  }
}

/**
 * Creates a new Kito server instance.
 *
 * @param options - Server configuration options
 * @returns New server instance
 *
 * @example
 * ```typescript
 * import { server } from 'kitojs';
 *
 * const app = server();
 *
 * app.get('/', ctx => {
 *   ctx.res.send('Hello World!');
 * });
 *
 * app.listen(3000);
 * ```
 */
// biome-ignore lint/complexity/noBannedTypes: ...
export function server(options?: ServerOptions): KitoServer<{}> {
  return new KitoServer(options);
}
