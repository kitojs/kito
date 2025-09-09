import type { Context } from "./ctx.d.ts";
import type { MiddlewareDescriptor } from "./middleware.d.ts";
import type { schema } from "./schema.d.ts";

export type ServerConfig = {};

export type Handler<S = unknown> = (ctx: Context<S>) => unknown | Promise<unknown>;

type MiddlewareLike = MiddlewareDescriptor | ReturnType<typeof schema>;

export interface RouteMethods {
	get<S>(path: string, middlewares: MiddlewareLike[], handler: Handler<S>): void;
	get<S>(path: string, handler: Handler<S>): void;

	post<S>(path: string, middlewares: MiddlewareLike[], handler: Handler<S>): void;
	post<S>(path: string, handler: Handler<S>): void;

	put<S>(path: string, middlewares: MiddlewareLike[], handler: Handler<S>): void;
	put<S>(path: string, handler: Handler<S>): void;

	delete<S>(path: string, middlewares: MiddlewareLike[], handler: Handler<S>): void;
	delete<S>(path: string, handler: Handler<S>): void;
}

export interface Server extends RouteMethods {
	use(middleware: MiddlewareDescriptor): void;
	listen(port: number): void;
}
