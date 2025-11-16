// biome-ignore assist/source/organizeImports: ...
import type {
  HttpMethod,
  MiddlewareDefinition,
  SchemaDefinition,
  ServerOptions,
  RouteHandler,
  MiddlewareHandler,
  KitoContext,
  RouteChain,
  KitoServerInstance,
} from "@kitojs/types";

import { ServerCore, type ServerOptionsCore } from "@kitojs/kito-core";
import { RequestBuilder } from "./request";
import { ResponseBuilder } from "./response";

import { analyzeHandler, type StaticResponseType } from "./analyzer";

/**
 * Main server class for Kito framework.
 * Provides HTTP routing, middleware support, and context extensions.
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
  implements KitoServerInstance<TExtensions>
{
  private globalMiddlewares: MiddlewareDefinition[] = [];
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
    this.serverOptions = { ...this.serverOptions, ...options };
    this.coreServer = new ServerCore({
      port: 3000,
      host: "0.0.0.0",
      ...options,
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

  /**
   * Registers a global middleware that runs for all routes.
   *
   * @param middleware - Middleware function or definition
   * @returns The server instance for chaining
   *
   * @example
   * ```typescript
   * app.use((ctx, next) => {
   *   console.log(`${ctx.req.method} ${ctx.req.url}`);
   *   next();
   * });
   * ```
   */
  use(
    middleware: MiddlewareDefinition | MiddlewareHandler,
  ): KitoServer<TExtensions> {
    if (typeof middleware === "function") {
      this.globalMiddlewares.push({
        type: "function",
        handler: middleware,
        global: true,
      });
    } else {
      this.globalMiddlewares.push({ ...middleware, global: true });
    }

    return this as KitoServer<TExtensions>;
  }

  /**
   * Registers a GET route.
   *
   * @template TSchema - Request schema type
   * @param path - Route path (supports :params)
   * @param handler - Route handler function
   * @returns The server instance for chaining
   *
   * @example
   * ```typescript
   * app.get('/users/:id', ctx => {
   *   ctx.res.json({ id: ctx.req.params.id });
   * });
   * ```
   */
  // biome-ignore lint/complexity/noBannedTypes: ...
  get<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoServer<TExtensions>;
  /**
   * Registers a GET route with middlewares and/or schema validation.
   *
   * @template TSchema - Request schema type
   * @param path - Route path
   * @param middlewares - Array of middlewares and/or schema definition
   * @param handler - Route handler function
   * @returns The server instance for chaining
   */
  // biome-ignore lint/complexity/noBannedTypes: ...
  get<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoServer<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  get<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handler?: RouteHandler<TSchema, TExtensions>,
  ): KitoServer<TExtensions> {
    this.addRoute<TSchema>("GET", path, middlewaresOrHandler, handler);

    return this as KitoServer<TExtensions>;
  }

  /**
   * Registers a POST route.
   *
   * @template TSchema - Request schema type
   * @param path - Route path
   * @param handler - Route handler function
   * @returns The server instance for chaining
   */
  // biome-ignore lint/complexity/noBannedTypes: ...
  post<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoServer<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  post<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoServer<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  post<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handler?: RouteHandler<TSchema, TExtensions>,
  ): KitoServer<TExtensions> {
    this.addRoute<TSchema>("POST", path, middlewaresOrHandler, handler);

    return this as KitoServer<TExtensions>;
  }

  /**
   * Registers a PUT route.
   *
   * @template TSchema - Request schema type
   * @param path - Route path
   * @param handler - Route handler function
   * @returns The server instance for chaining
   */
  // biome-ignore lint/complexity/noBannedTypes: ...
  put<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoServer<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  put<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoServer<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  put<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handler?: RouteHandler<TSchema, TExtensions>,
  ): KitoServer<TExtensions> {
    this.addRoute<TSchema>("PUT", path, middlewaresOrHandler, handler);

    return this as KitoServer<TExtensions>;
  }

  /**
   * Registers a DELETE route.
   *
   * @template TSchema - Request schema type
   * @param path - Route path
   * @param handler - Route handler function
   * @returns The server instance for chaining
   */
  // biome-ignore lint/complexity/noBannedTypes: ...
  delete<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoServer<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  delete<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoServer<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  delete<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handler?: RouteHandler<TSchema, TExtensions>,
  ): KitoServer<TExtensions> {
    this.addRoute<TSchema>("DELETE", path, middlewaresOrHandler, handler);

    return this as KitoServer<TExtensions>;
  }

  /**
   * Registers a PATCH route.
   *
   * @template TSchema - Request schema type
   * @param path - Route path
   * @param handler - Route handler function
   * @returns The server instance for chaining
   */
  // biome-ignore lint/complexity/noBannedTypes: ...
  patch<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoServer<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  patch<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoServer<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  patch<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handler?: RouteHandler<TSchema, TExtensions>,
  ): KitoServer<TExtensions> {
    this.addRoute<TSchema>("PATCH", path, middlewaresOrHandler, handler);

    return this as KitoServer<TExtensions>;
  }

  /**
   * Registers a HEAD route.
   *
   * @template TSchema - Request schema type
   * @param path - Route path
   * @param handler - Route handler function
   * @returns The server instance for chaining
   */
  // biome-ignore lint/complexity/noBannedTypes: ...
  head<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoServer<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  head<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoServer<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  head<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handler?: RouteHandler<TSchema, TExtensions>,
  ): KitoServer<TExtensions> {
    this.addRoute<TSchema>("HEAD", path, middlewaresOrHandler, handler);

    return this as KitoServer<TExtensions>;
  }

  /**
   * Registers an OPTIONS route.
   *
   * @template TSchema - Request schema type
   * @param path - Route path
   * @param handler - Route handler function
   * @returns The server instance for chaining
   */
  // biome-ignore lint/complexity/noBannedTypes: ...
  options<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoServer<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  options<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoServer<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  options<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handler?: RouteHandler<TSchema, TExtensions>,
  ): KitoServer<TExtensions> {
    this.addRoute<TSchema>("OPTIONS", path, middlewaresOrHandler, handler);

    return this as KitoServer<TExtensions>;
  }

  /**
   * Creates a route builder for chaining multiple HTTP methods on the same path.
   *
   * @param path - Base path for all routes in the chain
   * @returns Route chain builder
   *
   * @example
   * ```typescript
   * app.route('/api/users')
   *   .get(ctx => ctx.res.json(users))
   *   .post(ctx => ctx.res.json({ created: true }))
   *   .end();
   * ```
   */
  route(path: string): RouteChain<TExtensions> {
    const self = this;

    const chain: RouteChain<TExtensions> = {
      // biome-ignore lint/complexity/noBannedTypes: ...
      get<TSchema extends SchemaDefinition = {}>(
        middlewaresOrHandler:
          | (MiddlewareDefinition | TSchema)[]
          | RouteHandler<TSchema, TExtensions>,
        handler?: RouteHandler<TSchema, TExtensions>,
      ): RouteChain<TExtensions> {
        self.addRoute("GET", path, middlewaresOrHandler, handler);
        return chain;
      },

      // biome-ignore lint/complexity/noBannedTypes: ...
      post<TSchema extends SchemaDefinition = {}>(
        middlewaresOrHandler:
          | (MiddlewareDefinition | TSchema)[]
          | RouteHandler<TSchema, TExtensions>,
        handler?: RouteHandler<TSchema, TExtensions>,
      ): RouteChain<TExtensions> {
        self.addRoute("POST", path, middlewaresOrHandler, handler);
        return chain;
      },

      // biome-ignore lint/complexity/noBannedTypes: ...
      put<TSchema extends SchemaDefinition = {}>(
        middlewaresOrHandler:
          | (MiddlewareDefinition | TSchema)[]
          | RouteHandler<TSchema, TExtensions>,
        handler?: RouteHandler<TSchema, TExtensions>,
      ): RouteChain<TExtensions> {
        self.addRoute("PUT", path, middlewaresOrHandler, handler);
        return chain;
      },

      // biome-ignore lint/complexity/noBannedTypes: ...
      delete<TSchema extends SchemaDefinition = {}>(
        middlewaresOrHandler:
          | (MiddlewareDefinition | TSchema)[]
          | RouteHandler<TSchema, TExtensions>,
        handler?: RouteHandler<TSchema, TExtensions>,
      ): RouteChain<TExtensions> {
        self.addRoute("DELETE", path, middlewaresOrHandler, handler);
        return chain;
      },

      // biome-ignore lint/complexity/noBannedTypes: ...
      patch<TSchema extends SchemaDefinition = {}>(
        middlewaresOrHandler:
          | (MiddlewareDefinition | TSchema)[]
          | RouteHandler<TSchema, TExtensions>,
        handler?: RouteHandler<TSchema, TExtensions>,
      ): RouteChain<TExtensions> {
        self.addRoute("PATCH", path, middlewaresOrHandler, handler);
        return chain;
      },

      // biome-ignore lint/complexity/noBannedTypes: ...
      options<TSchema extends SchemaDefinition = {}>(
        middlewaresOrHandler:
          | (MiddlewareDefinition | TSchema)[]
          | RouteHandler<TSchema, TExtensions>,
        handler?: RouteHandler<TSchema, TExtensions>,
      ): RouteChain<TExtensions> {
        self.addRoute("OPTIONS", path, middlewaresOrHandler, handler);
        return chain;
      },

      // biome-ignore lint/complexity/noBannedTypes: ...
      head<TSchema extends SchemaDefinition = {}>(
        middlewaresOrHandler:
          | (MiddlewareDefinition | TSchema)[]
          | RouteHandler<TSchema, TExtensions>,
        handler?: RouteHandler<TSchema, TExtensions>,
      ): RouteChain<TExtensions> {
        self.addRoute("HEAD", path, middlewaresOrHandler, handler);
        return chain;
      },

      end(): KitoServer<TExtensions> {
        return self;
      },
    };

    return chain;
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

    let staticResponse: StaticResponseType = { type: "none" };

    if (this.globalMiddlewares.length === 0 && routeMiddlewares.length === 0) {
      staticResponse = analyzeHandler(finalHandler);
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

    const schemaJson = routeSchema
      ? this.serializeSchema(routeSchema)
      : undefined;

    const staticResponseJson =
      staticResponse.type !== "none"
        ? JSON.stringify(staticResponse)
        : undefined;

    this.coreServer.addRoute({
      method,
      path,
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

  /**
   * Starts the HTTP server and begins listening for requests.
   *
   * @param portOrCallback - Port number or ready callback
   * @param hostOrCallback - Host string or ready callback
   * @param maybeCallback - Ready callback
   * @returns Promise resolving to server configuration
   *
   * @example
   * ```typescript
   * // Empty
   * await app.listen();
   *
   * // Simple
   * await app.listen(3000);
   *
   * // With callback
   * await app.listen(3000, () => {
   *   console.log('Server ready!');
   * });
   *
   * // With port and host
   * await app.listen(3000, '127.0.0.1', () => {
   *   console.log('Server ready on 127.0.0.1:3000');
   * });
   * ```
   */
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
