import type {
  ServerConfig,
  ServerInterface,
  Request,
  Response,
  Middleware,
  MiddlewareHandler,
} from '../types/server.d.ts';
import { loadFunctions } from './ffi/loader.ts';
import type { InferType, RouteBuilder, SchemaType } from './schema.ts';
import { route, t } from './schema.ts';
import { encode, decode } from 'msgpackr';

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
  private lib: Deno.DynamicLibrary<Deno.ForeignLibraryInterface>;
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
    this.lib = loadFunctions()!;

    const handleRequestPtr = new Deno.UnsafeCallback(
      {
        parameters: ['pointer', 'usize'],
        result: 'pointer',
      },
      (ptr: Deno.PointerValue, len: number) => this.handleRequest(ptr, len),
    );

    this.lib.symbols.register_callback(handleRequestPtr.pointer);
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

    const encodedConfig = encode(configObject);

    callback?.();

    const configPtr = Deno.UnsafePointer.of(encodedConfig);
    this.lib.symbols.run(configPtr, encodedConfig.byteLength);
  }

  private handleRequest(
    ptr: Deno.PointerValue,
    len: number,
  ): Deno.PointerValue {
    const requestData = new Uint8Array(
      Deno.UnsafePointerView.getArrayBuffer(ptr, len),
    );
    let request: any;
    try {
      request = decode(requestData);
    } catch (e) {
      console.error('failed to decode messagepack request:', e);
      request = {};
    }
    const method: string = request.method || '';
    const path: string = request.path || '';

    const key = `${routesId[method]}:${path}`;
    const routeCallback = this.routeMap.get(key);
    let responseBuffer: ArrayBuffer | undefined;
    if (routeCallback) {
      const res: Response & {
        _buffer?: ArrayBuffer;
        _status?: number;
        _headers?: Record<string, string>;
        _cookies?: string[];
        _body?: string;
      } = {
        _status: 200,
        _headers: {},
        _cookies: [],
        _body: '',
        send(body: string | object) {
          const bodyStr =
            typeof body === 'string' ? body : JSON.stringify(body);
          this._body = bodyStr;

          if (this._cookies && this._cookies.length > 0) {
            this._headers!['Set-Cookie'] = this._cookies.join('; ');
          }

          const responseObj = {
            status: this._status || 200,
            headers: this._headers,
            body: bodyStr,
          };
          const encoded = encode(responseObj);

          this._buffer = encoded.buffer.slice(
            encoded.byteOffset,
            encoded.byteOffset + encoded.byteLength,
          );
          return this._buffer;
        },
        json(obj: object) {
          return this.send(obj);
        },
        status(code: number) {
          this._status = code;
          return this;
        },
        header(key: string, value: string) {
          this._headers![key] = value;
          return this;
        },
        cookie(name: string, value: string, options?: any) {
          let cookieStr = `${name}=${value}`;
          if (options) {
            if (options.maxAge) cookieStr += `; Max-Age=${options.maxAge}`;
            if (options.domain) cookieStr += `; Domain=${options.domain}`;
            if (options.path) cookieStr += `; Path=${options.path}`;
            if (options.expires)
              cookieStr += `; Expires=${options.expires.toUTCString()}`;
            if (options.httpOnly) cookieStr += `; HttpOnly`;
            if (options.secure) cookieStr += `; Secure`;
            if (options.sameSite) cookieStr += `; SameSite=${options.sameSite}`;
          }
          this._cookies!.push(cookieStr);
          return this;
        },
        redirect(url: string) {
          this.status(302);
          this.header('Location', url);
          return this.send('');
        },
        type(mime: string) {
          return this.header('Content-Type', mime);
        },
        append(key: string, value: string) {
          if (this._headers![key]) {
            this._headers![key] += ', ' + value;
          } else {
            this._headers![key] = value;
          }
          return this;
        },
        sendStatus(code: number) {
          this.status(code);
          return this.send('');
        },
        end() {
          return this.send('');
        },
      };

      const result = routeCallback(
        {
          method,
          headers: request.headers,
          query: request.query,
          body: request.body,
          url: request.url,
          params: request.params,
        },
        res,
      );
      if (result instanceof ArrayBuffer) {
        responseBuffer = result;
      } else if (res._buffer) {
        responseBuffer = res._buffer;
      }
      if (!responseBuffer) {
        console.warn('route callback did not produce a response');
        const encoded = encode({
          status: 500,
          headers: {},
          body: 'Internal Server Error',
        });
        responseBuffer = encoded.buffer.slice(
          encoded.byteOffset,
          encoded.byteOffset + encoded.byteLength,
        );
      }
    } else {
      console.warn('no route found for:', method, path);
      const encoded = encode({
        status: 404,
        headers: {},
        body: 'Not Found',
      });
      responseBuffer = encoded.buffer.slice(
        encoded.byteOffset,
        encoded.byteOffset + encoded.byteLength,
      );
    }

    const payload = new Uint8Array(responseBuffer);
    const totalLen = payload.length;
    const finalBuffer = new ArrayBuffer(8 + totalLen);
    const finalView = new DataView(finalBuffer);
    finalView.setBigUint64(0, BigInt(totalLen), true);
    new Uint8Array(finalBuffer, 8).set(payload);

    globalThis.__responseBuffers = globalThis.__responseBuffers || [];
    globalThis.__responseBuffers.push(finalBuffer);
    return Deno.UnsafePointer.of(new Uint8Array(finalBuffer));
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
