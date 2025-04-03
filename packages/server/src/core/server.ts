import type {
  ServerConfig,
  ServerInterface,
  Request,
  Response,
  Middleware,
  MiddlewareHandler,
} from '../types/server.d.ts';
import type { InferType, RouteBuilder, SchemaType } from './schema.ts';
import { route, t } from './schema.ts';

const routesId: Record<string, number> = {
  GET: 0,
  POST: 1,
  PUT: 2,
  PATCH: 3,
  DELETE: 4,
};

type RouteInfo = {
  path: string;
  method: string;
  callback: ((req: Request, res: Response) => ArrayBuffer | void) | undefined;
};

class Server implements ServerInterface {
  readonly config: ServerConfig;
  private routes: RouteInfo[] = [];
  private routeMap: Map<
    string,
    (req: Request, res: Response) => ArrayBuffer | void | Promise<void>
  > = new Map();
  private globalMiddlewares: Middleware[] = [];
  private routeSchemas: Map<
    string,
    { params?: Record<string, SchemaType>; response?: SchemaType }
  > = new Map();

  constructor(config?: ServerConfig) {
    const DEFAULT_CONFIG: ServerConfig = {};
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  listen(
    options: { port: number; hostname?: string } | number,
    callback?: () => void,
  ): void {
    const portConfig =
      typeof options === 'number'
        ? { port: options, hostname: '127.0.0.1' }
        : { ...options, hostname: options.hostname || '127.0.0.1' };

    const routesArray = this.routes.map((route) => {
      const key = `${routesId[route.method]}:${route.path}`;
      const schemaInfo = this.routeSchemas.get(key);

      return {
        path: route.path,
        method: route.method,
        schema: schemaInfo || null,
      };
    });

    const configObject = {
      host: portConfig.hostname,
      port: portConfig.port,
      routes: routesArray,
    };

    // run(configObject);
  }

  private convertPath(path: string): string {
    const segments = path.split('/');
    const converted = segments.map((seg) =>
      seg.startsWith(':') ? `{${seg.slice(1)}}` : seg,
    );
    const result = converted.join('/');

    if (result === '') {
      return '/';
    } else if (result.startsWith('/')) {
      return result;
    } else {
      return `/${result}`;
    }
  }

  private addRoute(
    path: string,
    method: string,
    ...handlers: MiddlewareHandler[]
  ): void {
    let pathConverted = this.convertPath(path);

    if (
      this.routes.find(
        (value) => value.path === pathConverted && value.method === method,
      )
    )
      throw new Error(
        `you cannot register two routes with the same path and method: ${method} ${path}`,
      );

    this.routes.push({
      path: pathConverted,
      method,
      callback: undefined,
    });

    const chain: MiddlewareHandler[] = [...this.globalMiddlewares, ...handlers];
    const composed = (
      req: Request,
      res: Response,
    ): ArrayBuffer | void | Promise<void> => {
      let i = 0;
      const next = (): ArrayBuffer | void | Promise<void> => {
        if (i < chain.length) {
          const fn = chain[i++];
          return fn(req, res, next);
        }
      };
      return next();
    };

    const code = routesId[method];
    this.routeMap.set(`${code}:${pathConverted}`, composed);
  }

  get<TParams extends Record<string, SchemaType>, TResponse extends SchemaType>(
    pathOrRoute: RouteBuilder<TParams, TResponse>,
    handler: (
      req: Request<
        TParams extends undefined
          ? any
          : { [K in keyof TParams]: InferType<TParams[K]> }
      >,
      res: Response<TResponse extends undefined ? any : InferType<TResponse>>,
    ) => void,
  ): void;
  get(path: string, handler: (req: Request, res: Response) => void): void;
  get(
    pathOrRoute: string | RouteBuilder<any, any>,
    handler: (req: Request<any>, res: Response<any>) => void,
  ): void {
    if (typeof pathOrRoute === 'string') {
      this.addRoute(pathOrRoute, 'GET', handler);
    } else {
      const path = pathOrRoute.getPath();
      const schemas = pathOrRoute.getSchemas();

      const convertedPath = this.convertPath(path);
      const routeKey = `${routesId['GET']}:${convertedPath}`;
      this.routeSchemas.set(routeKey, schemas);

      this.addRoute(path, 'GET', handler);
    }
  }

  post<
    TParams extends Record<string, SchemaType>,
    TResponse extends SchemaType,
  >(
    pathOrRoute: RouteBuilder<TParams, TResponse>,
    handler: (
      req: Request<
        TParams extends undefined
          ? any
          : { [K in keyof TParams]: InferType<TParams[K]> }
      >,
      res: Response<TResponse extends undefined ? any : InferType<TResponse>>,
    ) => void,
  ): void;
  post(path: string, handler: (req: Request, res: Response) => void): void;
  post(
    pathOrRoute: string | RouteBuilder<any, any>,
    handler: (req: Request<any>, res: Response<any>) => void,
  ): void {
    if (typeof pathOrRoute === 'string') {
      this.addRoute(pathOrRoute, 'POST', handler);
    } else {
      const path = pathOrRoute.getPath();
      const schemas = pathOrRoute.getSchemas();

      const convertedPath = this.convertPath(path);
      const routeKey = `${routesId['POST']}:${convertedPath}`;
      this.routeSchemas.set(routeKey, schemas);

      this.addRoute(path, 'POST', handler);
    }
  }

  put<TParams extends Record<string, SchemaType>, TResponse extends SchemaType>(
    pathOrRoute: RouteBuilder<TParams, TResponse>,
    handler: (
      req: Request<
        TParams extends undefined
          ? any
          : { [K in keyof TParams]: InferType<TParams[K]> }
      >,
      res: Response<TResponse extends undefined ? any : InferType<TResponse>>,
    ) => void,
  ): void;
  put(path: string, handler: (req: Request, res: Response) => void): void;
  put(
    pathOrRoute: string | RouteBuilder<any, any>,
    handler: (req: Request<any>, res: Response<any>) => void,
  ): void {
    if (typeof pathOrRoute === 'string') {
      this.addRoute(pathOrRoute, 'PUT', handler);
    } else {
      const path = pathOrRoute.getPath();
      const schemas = pathOrRoute.getSchemas();

      const convertedPath = this.convertPath(path);
      const routeKey = `${routesId['PUT']}:${convertedPath}`;
      this.routeSchemas.set(routeKey, schemas);

      this.addRoute(path, 'PUT', handler);
    }
  }

  patch<
    TParams extends Record<string, SchemaType>,
    TResponse extends SchemaType,
  >(
    pathOrRoute: RouteBuilder<TParams, TResponse>,
    handler: (
      req: Request<
        TParams extends undefined
          ? any
          : { [K in keyof TParams]: InferType<TParams[K]> }
      >,
      res: Response<TResponse extends undefined ? any : InferType<TResponse>>,
    ) => void,
  ): void;
  patch(path: string, handler: (req: Request, res: Response) => void): void;
  patch(
    pathOrRoute: string | RouteBuilder<any, any>,
    handler: (req: Request<any>, res: Response<any>) => void,
  ): void {
    if (typeof pathOrRoute === 'string') {
      this.addRoute(pathOrRoute, 'PATCH', handler);
    } else {
      const path = pathOrRoute.getPath();
      const schemas = pathOrRoute.getSchemas();

      const convertedPath = this.convertPath(path);
      const routeKey = `${routesId['PATCH']}:${convertedPath}`;
      this.routeSchemas.set(routeKey, schemas);

      this.addRoute(path, 'PATCH', handler);
    }
  }

  delete<
    TParams extends Record<string, SchemaType>,
    TResponse extends SchemaType,
  >(
    pathOrRoute: RouteBuilder<TParams, TResponse>,
    handler: (
      req: Request<
        TParams extends undefined
          ? any
          : { [K in keyof TParams]: InferType<TParams[K]> }
      >,
      res: Response<TResponse extends undefined ? any : InferType<TResponse>>,
    ) => void,
  ): void;
  delete(path: string, handler: (req: Request, res: Response) => void): void;
  delete(
    pathOrRoute: string | RouteBuilder<any, any>,
    handler: (req: Request<any>, res: Response<any>) => void,
  ): void {
    if (typeof pathOrRoute === 'string') {
      this.addRoute(pathOrRoute, 'DELETE', handler);
    } else {
      const path = pathOrRoute.getPath();
      const schemas = pathOrRoute.getSchemas();

      const convertedPath = this.convertPath(path);
      const routeKey = `${routesId['DELETE']}:${convertedPath}`;
      this.routeSchemas.set(routeKey, schemas);

      this.addRoute(path, 'DELETE', handler);
    }
  }
  use(middleware: Middleware): void {
    this.globalMiddlewares.push(middleware);
  }
}

function server(options?: ServerConfig): Server {
  return new Server(options);
}

export { server, route, t };
