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

type RouteInfo = { path: string, method: string, callback: (req: Request, res: Response) => void }

globalThis.__responseBuffers = globalThis.__responseBuffers || [];

class Kito implements KitoInterface {
  readonly config: KitoConfig;
  private lib: Deno.DynamicLibrary<Deno.ForeignLibraryInterface>;
  private routes: RouteInfo[] = [];
  private routeMap: Map<string, (req: Request, res: Response) => void> = new Map();

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
      const methodBytes = encoder.encode(route.method);

      routeData.set(pathBytes, offset);
      offset += pathBytes.length;
      routeData[offset++] = 0;

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
    const request = JSON.parse(decoder.decode(requestData));

    console.log("received request:", request);

    const callback = this.routeMap.get(`${request.method}:${request.path}`);
    let responseJson = "";
    if (callback) {
      const res = {
        body: "",
        status: 200,
        headers: {} as Record<string, string>,

        send(body: string | object) {
          this.body = typeof body === "string" ? body : JSON.stringify(body);
          return this;
        },
        json(obj: object) {
          this.body = JSON.stringify(obj);
          return this;
        },
        status(code: number) {
          this.status = code;
          return this;
        },
        header(key: string, value: string) {
          this.headers[key] = value;
          return this;
        },
      };

      callback(request, res as Response);

      responseJson = JSON.stringify({
        status: res.status,
        headers: res.headers,
        body: res.body,
      });

      console.log("sending response:", responseJson);
    } else {
      console.warn("no route found for:", request.method, request.path);
      responseJson = JSON.stringify({ status: 404, body: "Not Found" });
    }

    const responseBytes = new TextEncoder().encode(responseJson);

    const buffer = new Uint8Array(8 + responseBytes.length);
    const dv = new DataView(buffer.buffer);
    dv.setBigUint64(0, BigInt(responseBytes.length), true);
    buffer.set(responseBytes, 8);

    globalThis.__responseBuffers.push(buffer);

    return Deno.UnsafePointer.of(buffer);
  }

  private addRoute(path: string, method: string, callback: (req: Request, res: Response) => void) {
    this.routes.push({ path, method, callback });
    this.routeMap.set(`${method}:${path}`, callback);
  }

  get(path: string, callback: (req: Request, res: Response) => void): void {
    this.addRoute(path, "GET", callback);
  }

  post(path: string, callback: (req: Request, res: Response) => void): void {
    this.addRoute(path, "POST", callback);
  }

  put(path: string, callback: (req: Request, res: Response) => void): void {
    this.addRoute(path, "PUT", callback);
  }

  patch(
    path: string,
    callback: (req: Request, res: Response) => void,
  ): void {
    this.addRoute(path, "PATCH", callback);
  }

  delete(
    path: string,
    callback: (req: Request, res: Response) => void,
  ): void {
    this.addRoute(path, "DELETE", callback);
  }
}

function kito(options?: KitoConfig): Kito {
  return new Kito(options);
}

export { kito };
