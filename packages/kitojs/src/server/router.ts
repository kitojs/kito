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
  use(
    middleware: MiddlewareDefinition | MiddlewareHandler,
  ): KitoRouter<TExtensions> {
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
  mount(
    path: string,
    router: KitoRouter<TExtensions>,
  ): KitoRouter<TExtensions> {
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
  ): KitoRouter<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  get<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoRouter<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  get<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handler?: RouteHandler<TSchema, TExtensions>,
  ): KitoRouter<TExtensions> {
    this.addRoute<TSchema>("GET", path, middlewaresOrHandler, handler);
    return this;
  }

  /**
   * Registers a POST route.
   */
  // biome-ignore lint/complexity/noBannedTypes: ...
  post<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoRouter<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  post<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoRouter<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  post<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handler?: RouteHandler<TSchema, TExtensions>,
  ): KitoRouter<TExtensions> {
    this.addRoute<TSchema>("POST", path, middlewaresOrHandler, handler);
    return this;
  }

  /**
   * Registers a PUT route.
   */
  // biome-ignore lint/complexity/noBannedTypes: ...
  put<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoRouter<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  put<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoRouter<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  put<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handler?: RouteHandler<TSchema, TExtensions>,
  ): KitoRouter<TExtensions> {
    this.addRoute<TSchema>("PUT", path, middlewaresOrHandler, handler);
    return this;
  }

  /**
   * Registers a DELETE route.
   */
  // biome-ignore lint/complexity/noBannedTypes: ...
  delete<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoRouter<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  delete<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoRouter<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  delete<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handler?: RouteHandler<TSchema, TExtensions>,
  ): KitoRouter<TExtensions> {
    this.addRoute<TSchema>("DELETE", path, middlewaresOrHandler, handler);
    return this;
  }

  /**
   * Registers a PATCH route.
   */
  // biome-ignore lint/complexity/noBannedTypes: ...
  patch<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoRouter<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  patch<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoRouter<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  patch<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handler?: RouteHandler<TSchema, TExtensions>,
  ): KitoRouter<TExtensions> {
    this.addRoute<TSchema>("PATCH", path, middlewaresOrHandler, handler);
    return this;
  }

  /**
   * Registers a HEAD route.
   */
  // biome-ignore lint/complexity/noBannedTypes: ...
  head<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoRouter<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  head<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoRouter<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  head<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handler?: RouteHandler<TSchema, TExtensions>,
  ): KitoRouter<TExtensions> {
    this.addRoute<TSchema>("HEAD", path, middlewaresOrHandler, handler);
    return this;
  }

  /**
   * Registers an OPTIONS route.
   */
  // biome-ignore lint/complexity/noBannedTypes: ...
  options<TSchema extends SchemaDefinition = {}>(
    path: string,
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoRouter<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  options<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewares: (MiddlewareDefinition | TSchema)[],
    handler: RouteHandler<TSchema, TExtensions>,
  ): KitoRouter<TExtensions>;
  // biome-ignore lint/complexity/noBannedTypes: ...
  options<TSchema extends SchemaDefinition = {}>(
    path: string,
    middlewaresOrHandler:
      | (MiddlewareDefinition | TSchema)[]
      | RouteHandler<TSchema, TExtensions>,
    handler?: RouteHandler<TSchema, TExtensions>,
  ): KitoRouter<TExtensions> {
    this.addRoute<TSchema>("OPTIONS", path, middlewaresOrHandler, handler);
    return this;
  }

  /**
   * Creates a route builder for chaining multiple HTTP methods on the same path.
   *
   * @param path - Base path for all routes in the chain
   * @returns Route chain builder
   *
   * @example
   * ```typescript
   * router.route('/api/users')
   *   .get(({ res }) => res.json(users))
   *   .post(({ res }) => res.json({ created: true }))
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

    const normalizedPath = this.normalizePath(path);

    this.routes.push({
      method,
      path: normalizedPath,
      middlewares,
      handler: finalHandler as RouteHandler<SchemaDefinition, TExtensions>,
    });
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
