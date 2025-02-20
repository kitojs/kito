import type {
  KitoConfig,
  KitoInterface,
  Request,
  Response,
  Middleware,
  MiddlewareHandler,
} from '../types/server.d.ts';
import { loadFunctions } from './ffi/loader.ts';
import { encode, decode } from '@msgpack/msgpack';

const routesId: Record<string, number> = {
  GET: 0,
  POST: 1,
  PUT: 2,
  PATCH: 3,
  DELETE: 4,
};

type Handler = (req: Request, res: Response) => ArrayBuffer | void;

type RouteInfo = {
  path: string;
  method: string;
  callback: ((req: Request, res: Response) => ArrayBuffer | void) | undefined;
};

class Kito implements KitoInterface {
  readonly config: KitoConfig;
  private lib: Deno.DynamicLibrary<Deno.ForeignLibraryInterface>;
  private routes: RouteInfo[] = [];
  private routeMap: Map<
    string,
    (req: Request, res: Response) => ArrayBuffer | void
  > = new Map();
  private routesBuffer?: Uint8Array;
  private globalMiddlewares: Middleware[] = [];

  constructor(config?: KitoConfig) {
    const DEFAULT_CONFIG: KitoConfig = {};
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
        ? { port: options, hostname: 'localhost' }
        : { ...options, hostname: options.hostname || 'localhost' };

    const encoder = new TextEncoder();
    const hostStr = `${portConfig.hostname}\0`;
    const hostPtr = Deno.UnsafePointer.of(encoder.encode(hostStr));

    if (!this.routesBuffer) {
      let totalSize = 0;
      for (const route of this.routes) {
        totalSize += route.path.length + route.method.length + 2;
      }

      this.routesBuffer = new Uint8Array(totalSize);
      let offset = 0;
      for (const route of this.routes) {
        const pathBytes = encoder.encode(route.path);
        this.routesBuffer.set(pathBytes, offset);
        offset += pathBytes.length;
        this.routesBuffer[offset++] = 0;
        const methodBytes = encoder.encode(route.method);
        this.routesBuffer.set(methodBytes, offset);
        offset += methodBytes.length;
        this.routesBuffer[offset++] = 0;
      }
    }
    const routePtr = Deno.UnsafePointer.of(this.routesBuffer);

    callback?.();

    this.lib.symbols.run(
      hostPtr,
      portConfig.port,
      routePtr,
      this.routes.length,
    );
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
          path,
          headers: request.headers,
          query: request.query,
          body: request.body,
          url: request.url,
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

  private addRoute(
    path: string,
    method: string,
    ...handlers: MiddlewareHandler[]
  ): void {
    this.routes.push({ path, method, callback: undefined });

    const chain: MiddlewareHandler[] = [...this.globalMiddlewares, ...handlers];
    const composed = (req: Request, res: Response) => {
      let i = 0;
      const next = () => {
        if (i < chain.length) {
          const fn = chain[i++];
          fn(req, res, next);
        }
      };
      next();
    };

    const code = routesId[method];
    this.routeMap.set(`${code}:${path}`, composed);
  }

  get(path: string, ...handlers: MiddlewareHandler[]): void {
    this.addRoute(path, 'GET', ...handlers);
  }
  post(path: string, ...handlers: MiddlewareHandler[]): void {
    this.addRoute(path, 'POST', ...handlers);
  }
  put(path: string, ...handlers: MiddlewareHandler[]): void {
    this.addRoute(path, 'PUT', ...handlers);
  }
  patch(path: string, ...handlers: MiddlewareHandler[]): void {
    this.addRoute(path, 'PATCH', ...handlers);
  }
  delete(path: string, ...handlers: MiddlewareHandler[]): void {
    this.addRoute(path, 'DELETE', ...handlers);
  }
  use(middleware: Middleware): void {
    this.globalMiddlewares.push(middleware);
  }
}

function kito(options?: KitoConfig): Kito {
  return new Kito(options);
}

export { kito };
