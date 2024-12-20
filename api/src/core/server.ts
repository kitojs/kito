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

class Kito implements KitoInterface {
  readonly config: KitoConfig;
  private lib: Deno.DynamicLibrary<Deno.ForeignLibraryInterface>;

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

    this.lib.symbols.run(hostPtr, portConfig.port);

    callback?.();
  }

  private addRoute(
    path: string,
    method: string,
    callback: (req: Request, res: Response) => void,
  ): void {
    const encoder = new TextEncoder();
    const pathBytes = encoder.encode(`${path}\0`);
    const methodBytes = encoder.encode(`${method}\0`);

    const pathBuffer = new Uint8Array(pathBytes);
    const methodBuffer = new Uint8Array(methodBytes);

    const pathPtr = Deno.UnsafePointer.of(pathBuffer);
    const methodPtr = Deno.UnsafePointer.of(methodBuffer);

    this.lib.symbols.add_route(pathPtr, methodPtr, routesId[method]);
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
