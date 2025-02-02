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

class Kito implements KitoInterface {
  readonly config: KitoConfig;
  private lib: Deno.DynamicLibrary<Deno.ForeignLibraryInterface>;
  private routes: RouteInfo[] = [];

  constructor(config?: KitoConfig) {
    const DEFAULT_CONFIG: KitoConfig = {};

    this.config = { ...DEFAULT_CONFIG, ...config };
    this.lib = loadFunctions()!;
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

  private addRoute(
    path: string,
    method: string,
    callback: (req: Request, res: Response) => void,
  ): void {
    this.routes.push({ path, method, callback })
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
