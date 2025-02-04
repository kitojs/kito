import {
  KitoConfig,
  KitoInterface,
  Request,
  Response,
} from "../types/server.d.ts";
import { loadFunctions } from "./ffi/loader.ts";

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
    const decoder = new TextDecoder();
    const requestData = new Uint8Array(Deno.UnsafePointerView.getArrayBuffer(ptr, len));
    const buffer = requestData.buffer;
    const view = new DataView(buffer);
    const methodCode = view.getUint8(0);
    const pathLen = view.getUint16(1, true);
    const fullArray = new Uint8Array(buffer);
    const pathBytes = fullArray.slice(3, 3 + pathLen);
    const path = new TextDecoder().decode(pathBytes);

    const key = `${methodCode}:${path}`;
    const routeCallback = this.routeMap.get(key);
    let responseBuffer: ArrayBuffer | undefined;
    if (routeCallback) {
      const res: Response & { _buffer?: ArrayBuffer } = {
        _buffer: undefined,
        send(body: string | object) {
          const bodyStr =
            typeof body === "string" ? body : JSON.stringify(body);
          const bodyBytes = new TextEncoder().encode(bodyStr);
          const buffer = new ArrayBuffer(1 + 2 + bodyBytes.length);
          const view = new DataView(buffer);
          view.setUint8(0, 200);
          view.setUint16(1, bodyBytes.length, true);
          new Uint8Array(buffer, 3).set(bodyBytes);
          this._buffer = buffer;
          return buffer;
        },
        json(obj: object) {
          return this.send(JSON.stringify(obj));
        },
        status(code: number) {
          (this as any)._status = code;
          return this;
        },
        header(key: string, value: string) {
          return this;
        },
      };

      const result = routeCallback({ method: "", path }, res);
      if (result instanceof ArrayBuffer) {
        responseBuffer = result;
      } else if (res._buffer) {
        responseBuffer = res._buffer;
      }
      if (!responseBuffer) {
        console.warn("route callback did not produce a response");
        const errorStr = "Internal Server Error";
        const errorBytes = new TextEncoder().encode(errorStr);
        const buf = new ArrayBuffer(1 + 2 + errorBytes.length);
        const dv = new DataView(buf);
        dv.setUint8(0, 500);
        dv.setUint16(1, errorBytes.length, true);
        new Uint8Array(buf, 3).set(errorBytes);
        responseBuffer = buf;
      }
    } else {
      console.warn("no route found for:", methodCode, path);
      const errorStr = "Not Found";
      const errorBytes = new TextEncoder().encode(errorStr);
      const buf = new ArrayBuffer(1 + 2 + errorBytes.length);
      const dv = new DataView(buf);
      dv.setUint8(0, 404);
      dv.setUint16(1, errorBytes.length, true);
      new Uint8Array(buf, 3).set(errorBytes);
      responseBuffer = buf;
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
