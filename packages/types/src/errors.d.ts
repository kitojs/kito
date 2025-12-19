import type { KitoContext } from "./index";

// biome-ignore lint/suspicious/noExplicitAny: ...
export interface ErrorContext<TError = any, TExtensions = any>
  // biome-ignore lint/suspicious/noExplicitAny: ...
  extends KitoContext<any, TExtensions> {
  error: TError;
}

// biome-ignore lint/suspicious/noExplicitAny: ...
export type ErrorHandler<TError = any, TExtensions = any> = (
  context: ErrorContext<TError, TExtensions>,
) => void | Promise<void>;

// biome-ignore lint/suspicious/noExplicitAny: ...
export type ObserveErrorContext<TError = any, TExtensions = any> = ErrorContext<
  TError,
  TExtensions
>;

// biome-ignore lint/suspicious/noExplicitAny: ...
export type ObserveErrorHandler<TError = any, TExtensions = any> = (
  context: ObserveErrorContext<TError, TExtensions>,
) => void | Promise<void>;

// biome-ignore lint/suspicious/noExplicitAny: ...
export interface ErrorHandlerDefinition<TExtensions = any> {
  type: "specific" | "code" | "global";
  // biome-ignore lint/suspicious/noExplicitAny: ...
  target?: any | string | any[];
  // biome-ignore lint/suspicious/noExplicitAny: ...
  handler: ErrorHandler<any, TExtensions>;
}
