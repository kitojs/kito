import {
  KitoConfig,
  KitoInterface,
  Request,
  Response,
} from "../types/server.d.ts";
import { loadFunctions } from "./ffi/loader.ts";
import { encode, decode } from "@msgpack/msgpack";

const routesId: Record<string, number> = {
  "GET": 0,
  "POST": 1,
  "PUT": 2,
  "PATCH": 3,
  "DELETE": 4,
};

type RouteInfo = {
  path: string;
  method: string;
  callback: (req: Request, res: Response) => ArrayBuffer;
};

class Kito implements KitoInterface {
  readonly config: KitoConfig;
  private lib: Deno.DynamicLibrary<Deno.ForeignLibraryInterface>;
  private routes: RouteInfo[] = [];
  private routeMap: Map<string, (req: Request, res: Response) => ArrayBuffer> = new Map();

  constructor(config?: KitoConfig) {
    const DEFAULT_CONFIG: KitoConfig = {};
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.lib = loadFunctions()!;

    const handleRequestPtr = new Deno.UnsafeCallback(
      {
        parameters: ["pointer", "usize"],
        result: "pointer",
      },
      (ptr: Deno.PointerValue, len: number) => this.handleRequest(ptr, len)
    );

    this.lib.symbols.register_callback(handleRequestPtr.pointer);
  }

  listen(
    options: { port: number; hostname?: string } | number,
    callback?: () => void,
  ): void {
    const portConfig = typeof options === "number"
      ? { port: options, hostname: "localhost" }
      : { ...options, hostname: options.hostname || "localhost" };

    const encoder = new TextEncoder();
    const hostPtr = Deno.UnsafePointer.of(
      encoder.encode(`${portConfig.hostname}\0`),
    );

    const routes = this.routes.map(route => ({
      path: route.path,
      method: route.method,
      methodId: routesId[route.method]
    }));

    let totalSize = 0;
    for (const route of routes) {
      totalSize += route.path.length + route.method.length + 2;
    }

    const routeData = new Uint8Array(totalSize);
    let offset = 0;
    for (const route of routes) {
      const pathBytes = encoder.encode(route.path);
      routeData.set(pathBytes, offset);
      offset += pathBytes.length;
      routeData[offset++] = 0;
      const methodBytes = encoder.encode(route.method);
      routeData.set(methodBytes, offset);
      offset += methodBytes.length;
      routeData[offset++] = 0;
    }
    const routePtr = Deno.UnsafePointer.of(routeData);

    this.lib.symbols.add_routes(routePtr, routes.length);
    this.lib.symbols.run(hostPtr, portConfig.port);

    callback?.();
  }

  private handleRequest(ptr: Deno.PointerValue, len: number): Deno.PointerValue {
    const requestData = new Uint8Array(
      Deno.UnsafePointerView.getArrayBuffer(ptr, len)
    );
    let request: any;
    try {
      request = decode(requestData);
    } catch (e) {
      console.error("failed to decode messagepack request:", e);
      request = {};
    }

    const method: string = request.method || "";
    const path: string = request.path || "";

    const key = `${routesId[method]}:${path}`;
    const routeCallback = this.routeMap.get(key);
    let responseBuffer: ArrayBuffer | undefined;
    if (routeCallback) {
      const res: Response & { _buffer?: ArrayBuffer } = {
        _buffer: undefined,
        send(body: string | object) {
          const responseObj = { status: 200, headers: {}, body };
          const encoded = encode(responseObj);
          this._buffer = encoded.buffer.slice(
            encoded.byteOffset,
            encoded.byteOffset + encoded.byteLength
          );
          return this._buffer;
        },
        json(obj: object) {
          return this.send(obj);
        },
        status(code: number) {
          (this as any)._status = code;
          return this;
        },
        header(key: string, value: string) {
          return this;
        },
      };

      const result = routeCallback(
        { method, path, headers: request.headers, query: request.query, body: request.body, url: request.url },
        res
      );
      if (result instanceof ArrayBuffer) {
        responseBuffer = result;
      } else if (res._buffer) {
        responseBuffer = res._buffer;
      }
      if (!responseBuffer) {
        console.warn("route callback did not produce a response");
        const encoded = encode({ status: 500, headers: {}, body: "Internal Server Error" });
        responseBuffer = encoded.buffer.slice(
          encoded.byteOffset,
          encoded.byteOffset + encoded.byteLength
        );
      }
    } else {
      console.warn("no route found for:", method, path);
      const encoded = encode({ status: 404, headers: {}, body: "Not Found" });
      responseBuffer = encoded.buffer.slice(
        encoded.byteOffset,
        encoded.byteOffset + encoded.byteLength
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
    callback: (req: Request, res: Response) => ArrayBuffer
  ) {
    this.routes.push({ path, method, callback });
    const code = routesId[method];
    this.routeMap.set(`${code}:${path}`, callback);
  }

  get(path: string, callback: (req: Request, res: Response) => ArrayBuffer): void {
    this.addRoute(path, "GET", callback);
  }
  post(path: string, callback: (req: Request, res: Response) => ArrayBuffer): void {
    this.addRoute(path, "POST", callback);
  }
  put(path: string, callback: (req: Request, res: Response) => ArrayBuffer): void {
    this.addRoute(path, "PUT", callback);
  }
  patch(path: string, callback: (req: Request, res: Response) => ArrayBuffer): void {
    this.addRoute(path, "PATCH", callback);
  }
  delete(path: string, callback: (req: Request, res: Response) => ArrayBuffer): void {
    this.addRoute(path, "DELETE", callback);
  }
}

function kito(options?: KitoConfig): Kito {
  return new Kito(options);
}

export { kito };
