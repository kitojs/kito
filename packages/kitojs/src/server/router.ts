// biome-ignore assist/source/organizeImports: ...
import type {
  HttpMethod,
  MiddlewareDefinition,
  SchemaDefinition,
  RouteHandler,
  MiddlewareHandler,
  RouteChain,
  KitoRouterInstance,
  RouteDefinition,
} from "@kitojs/types";

/**
 * Router class for Kito.
 * Provides HTTP routing and middleware support with the ability to mount sub-routers.
 *
 * @template TExtensions - Type of custom extensions added to the context
 *
 * @example
 * ```typescript
 * const router = new KitoRouter();
 *
 * router.get('/', ({ res }) => {
 *   res.send('Hello from router!');
 * });
 *
 * export default router;
 * ```
 */
// biome-ignore lint/complexity/noBannedTypes: ...
export class KitoRouter<TExtensions = {}>
  implements KitoRouterInstance<TExtensions>
{
  protected routes: RouteDefinition<TExtensions>[] = [];
  protected middlewares: MiddlewareDefinition[] = [];
  protected prefix = "";

  /**
   * Registers a global middleware that runs for all routes in this router.
   *
   * @param middleware - Middleware function or definition
   * @returns The router instance for chaining
   *
   * @example
   * ```typescript
   * router.use((ctx, next) => {
   *   console.log(`${ctx.req.method} ${ctx.req.url}`);
   *   next();
   * });
   * ```
   */
  use(middleware: MiddlewareDefinition | MiddlewareHandler): this {
    if (typeof middleware === "function") {
      this.middlewares.push({
        type: "function",
        handler: middleware,
        global: true,
      });
    } else {
      this.middlewares.push({ ...middleware, global: true });
    }

    return this;
  }

  /**
   * Mounts a sub-router at the specified path.
   *
   * @param path - Base path for the sub-router
   * @param router - Router instance to mount
   * @returns The router instance for chaining
   *
   * @example
   * ```typescript
   * const apiRouter = router();
   * apiRouter.get('/users', ({ res }) => res.json({ users: [] }));
   *
   * const app = server();
   * app.mount('/api', apiRouter);
   * ```
   */
  mount(path: string, router: KitoRouter<TExtensions>): this {
    const normalizedPath = this.normalizePath(path);

    const mountedRoutes = router.getRoutes().map((route) => ({
      ...route,
      path: normalizedPath + route.path,
    }));

    this.routes.push(...mountedRoutes);

    return this;
  }

  /**
   * Registers a GET route.
   */
  // biome-ignore lint/complexity/noBannedTypes: ...
  get<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): this;
  // biome-ignore lint/complexity/noBannedTypes: ...
  get<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): this;
  // biome-ignore lint/complexity/noBannedTypes: ...
  get<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
    schema: TSchema,
  ): this;
  // biome-ignore lint/complexity/noBannedTypes: ...
  get<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handlerOrSchema?: RouteHandler<TSchema, TExtensions> | TSchema,
  ): this {
    this.addRoute<TSchema>("GET", path, middlewaresOrHandler, handlerOrSchema);
    return this;
  }

  /**
   * Registers a POST route.
   */
  // biome-ignore lint/complexity/noBannedTypes: ...
  post<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): this;
  // biome-ignore lint/complexity/noBannedTypes: ...
  post<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): this;
  // biome-ignore lint/complexity/noBannedTypes: ...
  post<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
    schema: TSchema,
  ): this;
  // biome-ignore lint/complexity/noBannedTypes: ...
  post<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handlerOrSchema?: RouteHandler<TSchema, TExtensions> | TSchema,
  ): this {
    this.addRoute<TSchema>("POST", path, middlewaresOrHandler, handlerOrSchema);
    return this;
  }

  /**
   * Registers a PUT route.
   */
  // biome-ignore lint/complexity/noBannedTypes: ...
  put<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): this;
  // biome-ignore lint/complexity/noBannedTypes: ...
  put<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): this;
  // biome-ignore lint/complexity/noBannedTypes: ...
  put<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
    schema: TSchema,
  ): this;
  // biome-ignore lint/complexity/noBannedTypes: ...
  put<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handlerOrSchema?: RouteHandler<TSchema, TExtensions> | TSchema,
  ): this {
    this.addRoute<TSchema>("PUT", path, middlewaresOrHandler, handlerOrSchema);
    return this;
  }

  /**
   * Registers a DELETE route.
   */
  // biome-ignore lint/complexity/noBannedTypes: ...
  delete<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): this;
  // biome-ignore lint/complexity/noBannedTypes: ...
  delete<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): this;
  // biome-ignore lint/complexity/noBannedTypes: ...
  delete<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
    schema: TSchema,
  ): this;
  // biome-ignore lint/complexity/noBannedTypes: ...
  delete<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handlerOrSchema?: RouteHandler<TSchema, TExtensions> | TSchema,
  ): this {
    this.addRoute<TSchema>(
      "DELETE",
      path,
      middlewaresOrHandler,
      handlerOrSchema,
    );
    return this;
  }

  /**
   * Registers a PATCH route.
   */
  // biome-ignore lint/complexity/noBannedTypes: ...
  patch<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): this;
  // biome-ignore lint/complexity/noBannedTypes: ...
  patch<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): this;
  // biome-ignore lint/complexity/noBannedTypes: ...
  patch<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
    schema: TSchema,
  ): this;
  // biome-ignore lint/complexity/noBannedTypes: ...
  patch<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handlerOrSchema?: RouteHandler<TSchema, TExtensions> | TSchema,
  ): this {
    this.addRoute<TSchema>(
      "PATCH",
      path,
      middlewaresOrHandler,
      handlerOrSchema,
    );
    return this;
  }

  /**
   * Registers a HEAD route.
   */
  // biome-ignore lint/complexity/noBannedTypes: ...
  head<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): this;
  // biome-ignore lint/complexity/noBannedTypes: ...
  head<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): this;
  // biome-ignore lint/complexity/noBannedTypes: ...
  head<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
    schema: TSchema,
  ): this;
  // biome-ignore lint/complexity/noBannedTypes: ...
  head<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handlerOrSchema?: RouteHandler<TSchema, TExtensions> | TSchema,
  ): this {
    this.addRoute<TSchema>("HEAD", path, middlewaresOrHandler, handlerOrSchema);
    return this;
  }

  /**
   * Registers an OPTIONS route.
   */
  // biome-ignore lint/complexity/noBannedTypes: ...
  options<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): this;
  // biome-ignore lint/complexity/noBannedTypes: ...
  options<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): this;
  // biome-ignore lint/complexity/noBannedTypes: ...
  options<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
    schema: TSchema,
  ): this;
  // biome-ignore lint/complexity/noBannedTypes: ...
  options<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handlerOrSchema?: RouteHandler<TSchema, TExtensions> | TSchema,
  ): this {
    this.addRoute<TSchema>(
      "OPTIONS",
      path,
      middlewaresOrHandler,
      handlerOrSchema,
    );
    return this;
  }

  /**
   * Creates a route builder for chaining multiple HTTP methods on the same path.
   *
   * @param path - Base path for all routes in the chain
   * @param routeMiddlewares - Optional middleware to apply to all routes in the chain
   * @returns Route chain builder
   *
   * @example
   * ```typescript
   * router.route('/api/users')
   *   .get(({ res }) => res.json(users))
   *   .post(({ res }) => res.json({ created: true }))
   *   .end();
   * ```
   *
   * @example With middleware
   * ```typescript
   * const auth = middleware((ctx, next) => {
   *   // authentication logic
   *   next();
   * });
   *
   * router.route('/admin', [auth])
   *   .get(({ res }) => res.send('Admin dashboard'))
   *   .post(({ res }) => res.send('Admin create'));
   * ```
   */
  route(
    path: string,
    routeMiddlewares?: MiddlewareDefinition[],
  ): RouteChain<TExtensions> {
    const self = this;

    const mergeMiddlewares = <TSchema extends SchemaDefinition>(
      callMiddlewares?: (MiddlewareDefinition | TSchema)[],
    ): (MiddlewareDefinition | TSchema)[] => {
      if (!routeMiddlewares && !callMiddlewares) return [];
      if (!routeMiddlewares) return callMiddlewares || [];
      if (!callMiddlewares)
        return routeMiddlewares as (MiddlewareDefinition | TSchema)[];
      return [...routeMiddlewares, ...callMiddlewares] as (
        | MiddlewareDefinition
        | TSchema
      )[];
    };

    const chain: RouteChain<TExtensions> = {
      // biome-ignore lint/complexity/noBannedTypes: ...
      get<TSchema extends SchemaDefinition = {}>(
        middlewaresOrHandler:
          | (MiddlewareDefinition | TSchema)[]
          | RouteHandler<TSchema, TExtensions>,
        handler?: RouteHandler<TSchema, TExtensions>,
      ): RouteChain<TExtensions> {
        if (typeof middlewaresOrHandler === "function") {
          self.addRoute(
            "GET",
            path,
            mergeMiddlewares<TSchema>(),
            middlewaresOrHandler,
          );
        } else {
          self.addRoute(
            "GET",
            path,
            mergeMiddlewares<TSchema>(middlewaresOrHandler),
            handler,
          );
        }
        return chain;
      },

      // biome-ignore lint/complexity/noBannedTypes: ...
      post<TSchema extends SchemaDefinition = {}>(
        middlewaresOrHandler:
          | (MiddlewareDefinition | TSchema)[]
          | RouteHandler<TSchema, TExtensions>,
        handler?: RouteHandler<TSchema, TExtensions>,
      ): RouteChain<TExtensions> {
        if (typeof middlewaresOrHandler === "function") {
          self.addRoute(
            "POST",
            path,
            mergeMiddlewares<TSchema>(),
            middlewaresOrHandler,
          );
        } else {
          self.addRoute(
            "POST",
            path,
            mergeMiddlewares<TSchema>(middlewaresOrHandler),
            handler,
          );
        }
        return chain;
      },

      // biome-ignore lint/complexity/noBannedTypes: ...
      put<TSchema extends SchemaDefinition = {}>(
        middlewaresOrHandler:
          | (MiddlewareDefinition | TSchema)[]
          | RouteHandler<TSchema, TExtensions>,
        handler?: RouteHandler<TSchema, TExtensions>,
      ): RouteChain<TExtensions> {
        if (typeof middlewaresOrHandler === "function") {
          self.addRoute(
            "PUT",
            path,
            mergeMiddlewares<TSchema>(),
            middlewaresOrHandler,
          );
        } else {
          self.addRoute(
            "PUT",
            path,
            mergeMiddlewares<TSchema>(middlewaresOrHandler),
            handler,
          );
        }
        return chain;
      },

      // biome-ignore lint/complexity/noBannedTypes: ...
      delete<TSchema extends SchemaDefinition = {}>(
        middlewaresOrHandler:
          | (MiddlewareDefinition | TSchema)[]
          | RouteHandler<TSchema, TExtensions>,
        handler?: RouteHandler<TSchema, TExtensions>,
      ): RouteChain<TExtensions> {
        if (typeof middlewaresOrHandler === "function") {
          self.addRoute(
            "DELETE",
            path,
            mergeMiddlewares<TSchema>(),
            middlewaresOrHandler,
          );
        } else {
          self.addRoute(
            "DELETE",
            path,
            mergeMiddlewares<TSchema>(middlewaresOrHandler),
            handler,
          );
        }
        return chain;
      },

      // biome-ignore lint/complexity/noBannedTypes: ...
      patch<TSchema extends SchemaDefinition = {}>(
        middlewaresOrHandler:
          | (MiddlewareDefinition | TSchema)[]
          | RouteHandler<TSchema, TExtensions>,
        handler?: RouteHandler<TSchema, TExtensions>,
      ): RouteChain<TExtensions> {
        if (typeof middlewaresOrHandler === "function") {
          self.addRoute(
            "PATCH",
            path,
            mergeMiddlewares<TSchema>(),
            middlewaresOrHandler,
          );
        } else {
          self.addRoute(
            "PATCH",
            path,
            mergeMiddlewares<TSchema>(middlewaresOrHandler),
            handler,
          );
        }
        return chain;
      },

      // biome-ignore lint/complexity/noBannedTypes: ...
      options<TSchema extends SchemaDefinition = {}>(
        middlewaresOrHandler:
          | (MiddlewareDefinition | TSchema)[]
          | RouteHandler<TSchema, TExtensions>,
        handler?: RouteHandler<TSchema, TExtensions>,
      ): RouteChain<TExtensions> {
        if (typeof middlewaresOrHandler === "function") {
          self.addRoute(
            "OPTIONS",
            path,
            mergeMiddlewares<TSchema>(),
            middlewaresOrHandler,
          );
        } else {
          self.addRoute(
            "OPTIONS",
            path,
            mergeMiddlewares<TSchema>(middlewaresOrHandler),
            handler,
          );
        }
        return chain;
      },

      // biome-ignore lint/complexity/noBannedTypes: ...
      head<TSchema extends SchemaDefinition = {}>(
        middlewaresOrHandler:
          | (MiddlewareDefinition | TSchema)[]
          | RouteHandler<TSchema, TExtensions>,
        handler?: RouteHandler<TSchema, TExtensions>,
      ): RouteChain<TExtensions> {
        if (typeof middlewaresOrHandler === "function") {
          self.addRoute(
            "HEAD",
            path,
            mergeMiddlewares<TSchema>(),
            middlewaresOrHandler,
          );
        } else {
          self.addRoute(
            "HEAD",
            path,
            mergeMiddlewares<TSchema>(middlewaresOrHandler),
            handler,
          );
        }
        return chain;
      },

      end(): KitoRouter<TExtensions> {
        return self;
      },
    };

    return chain;
  }

  // biome-ignore lint/complexity/noBannedTypes: ...
  protected addRoute<TSchema extends SchemaDefinition = {}>(
    method: HttpMethod,
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handlerOrSchema?: RouteHandler<TSchema, TExtensions> | TSchema,
  ): void {
    let finalHandler: RouteHandler<TSchema, TExtensions>;
    let middlewares: (MiddlewareDefinition | TSchema)[] = [];

    if (typeof middlewaresOrHandler === "function") {
      finalHandler = middlewaresOrHandler as RouteHandler<TSchema, TExtensions>;

      if (handlerOrSchema && this.isSchemaDefinition(handlerOrSchema)) {
        middlewares = [handlerOrSchema as TSchema];
      }
    } else {
      middlewares = middlewaresOrHandler as (MiddlewareDefinition | TSchema)[];
      finalHandler = handlerOrSchema as RouteHandler<TSchema, TExtensions>;
    }

    const normalizedPath = this.normalizePath(path);

    this.routes.push({
      method,
      path: normalizedPath,
      middlewares,
      handler: finalHandler as RouteHandler<SchemaDefinition, TExtensions>,
    });
  }

  // biome-ignore lint/suspicious/noExplicitAny: ...
  protected isSchemaDefinition(item: any): item is SchemaDefinition {
    return item && (item.params || item.query || item.body || item.headers);
  }

  protected getRoutes(): RouteDefinition<TExtensions>[] {
    return this.routes;
  }

  protected getMiddlewares(): MiddlewareDefinition[] {
    return this.middlewares;
  }

  private normalizePath(path: string): string {
    let normalized = path.startsWith("/") ? path : `/${path}`;
    if (normalized.length > 1 && normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  }
}

/**
 * Creates a new Router instance.
 *
 * @returns New router instance
 *
 * @example
 * ```typescript
 * import { router } from 'kitojs';
 *
 * const cats = router();
 *
 * cats.get('/', ({ res }) => {
 *   res.send('hello from cats!');
 * });
 *
 * export default cats;
 * ```
 */
// biome-ignore lint/complexity/noBannedTypes: ...
export function router<TExtensions = {}>(): KitoRouter<TExtensions> {
  return new KitoRouter<TExtensions>();
}
