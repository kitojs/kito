import type { KitoContext } from "./context";

export type NextFunction = () => void | Promise<void>;

export type MiddlewareHandler<TSchema = unknown, TExtensions = unknown> = (
  ctx: KitoContext<TSchema> & TExtensions,
  next: NextFunction,
) => void | Promise<void>;

export type RouteHandler<TSchema extends SchemaDefinition, TExtensions> = (
  ctx: KitoContext<TSchema> & TExtensions,
) => void | Promise<void> | unknown | Promise<unknown>;
