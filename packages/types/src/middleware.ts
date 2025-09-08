import type { RouteContext } from "./ctx.d.ts";

export type Next = () => Promise<void>;

export type Middleware<P = any, Q = any, B = any> = (
	ctx: RouteContext<P, Q, B>,
	next: Next,
) => Promise<void> | void;

export type MiddlewareDescriptor = {
	kind: "middleware";
	handler: Middleware;
};
