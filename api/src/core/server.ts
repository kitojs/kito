import {
	KitoConfig,
	KitoInterface,
	Request,
	Response
} from '../types/server.d.ts'
import { loadFunctions } from "./ffi/loader.ts";

class Kito implements KitoInterface {
	readonly config: KitoConfig

	constructor(config?: KitoConfig) {
		const DEFAULT_CONFIG: KitoConfig = {}

		this.config = { ...DEFAULT_CONFIG, ...config }
	}

	listen(
		options: { port: number; hostname?: string } | number,
		callback?: () => void
	): void {
		const portConfig =
			typeof options === 'number'
				? { port: options, hostname: 'localhost' }
				: { ...options, hostname: options.hostname || 'localhost' }

		const lib = loadFunctions()!;

		const encoder = new TextEncoder();
        const hostPtr = Deno.UnsafePointer.of(encoder.encode(`${portConfig.hostname}\0`));

		lib.symbols.run(hostPtr, portConfig.port);

		callback?.()
	}

    get(path: string, callback: (req: Request, res: Response) => void): void {
        const lib = loadFunctions()!;
        const encoder = new TextEncoder();
        const pathBytes = encoder.encode(`${path}\0`);
        const methodBytes = encoder.encode(`GET\0`);

        const pathBuffer = new Uint8Array(pathBytes);
        const methodBuffer = new Uint8Array(methodBytes);

        const pathPtr = Deno.UnsafePointer.of(pathBuffer);
        const methodPtr = Deno.UnsafePointer.of(methodBuffer);

        lib.symbols.add_route(pathPtr, methodPtr, 0);
    }

	post(path: string, callback: (req: Request, res: Response) => void): void {
		const lib = loadFunctions()!;
        const encoder = new TextEncoder();
        const pathBytes = encoder.encode(`${path}\0`);
        const methodBytes = encoder.encode(`POST\0`);

        const pathBuffer = new Uint8Array(pathBytes);
        const methodBuffer = new Uint8Array(methodBytes);

        const pathPtr = Deno.UnsafePointer.of(pathBuffer);
        const methodPtr = Deno.UnsafePointer.of(methodBuffer);

        lib.symbols.add_route(pathPtr, methodPtr, 1);
	}

	put(path: string, callback: (req: Request, res: Response) => void): void {
		const lib = loadFunctions()!;
        const encoder = new TextEncoder();
        const pathBytes = encoder.encode(`${path}\0`);
        const methodBytes = encoder.encode(`PUT\0`);

        const pathBuffer = new Uint8Array(pathBytes);
        const methodBuffer = new Uint8Array(methodBytes);

        const pathPtr = Deno.UnsafePointer.of(pathBuffer);
        const methodPtr = Deno.UnsafePointer.of(methodBuffer);

        lib.symbols.add_route(pathPtr, methodPtr, 2);
	}

	patch(
		path: string,
		callback: (req: Request, res: Response) => void
	): void {
		const lib = loadFunctions()!;
        const encoder = new TextEncoder();
        const pathBytes = encoder.encode(`${path}\0`);
        const methodBytes = encoder.encode(`PATCH\0`);

        const pathBuffer = new Uint8Array(pathBytes);
        const methodBuffer = new Uint8Array(methodBytes);

        const pathPtr = Deno.UnsafePointer.of(pathBuffer);
        const methodPtr = Deno.UnsafePointer.of(methodBuffer);

        lib.symbols.add_route(pathPtr, methodPtr, 3);
	}

	delete(
		path: string,
		callback: (req: Request, res: Response) => void
	): void {
		const lib = loadFunctions()!;
        const encoder = new TextEncoder();
        const pathBytes = encoder.encode(`${path}\0`);
        const methodBytes = encoder.encode(`DELETE\0`);

        const pathBuffer = new Uint8Array(pathBytes);
        const methodBuffer = new Uint8Array(methodBytes);

        const pathPtr = Deno.UnsafePointer.of(pathBuffer);
        const methodPtr = Deno.UnsafePointer.of(methodBuffer);

        lib.symbols.add_route(pathPtr, methodPtr, 4);
	}
}

function kito(options?: KitoConfig): Kito {
	return new Kito(options)
}

export { kito }
