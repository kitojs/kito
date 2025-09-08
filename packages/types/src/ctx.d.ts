import type { Request, Response } from "./http.d.ts";

export type RouteContext<Params = any, Query = any, Body = any> = {
	req: Request<Params, Query, Body>;
	res: Response;
};

export type Context<S> = S extends { __ctx: infer C } ? C : RouteContext;
