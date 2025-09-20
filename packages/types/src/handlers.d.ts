import type { KitoContext } from "./context";

export type NextFunction = () => void | Promise<void>;

export type MiddlewareHandler<TSchema = unknown> = (
  ctx: KitoContext<TSchema>,
  next: NextFunction,
) => void | Promise<void>;

export type RouteHandler<TSchema = unknown> = (
  ctx: KitoContext<TSchema>,
) => void | Promise<void> | unknown | Promise<unknown>;
