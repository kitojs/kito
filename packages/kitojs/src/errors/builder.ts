// biome-ignore lint/suspicious/noExplicitAny: ...
export class KitoError<T = any> extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly data: T;

  constructor(code: string, status: number, message: string, data: T) {
    super(message);
    this.name = "KitoError";
    this.code = code;
    this.status = status;
    this.data = data;
  }
}

export type ErrorFactory<T> = T extends void
  ? () => KitoError<void>
  : (data: T) => KitoError<T>;

export class ErrorBuilder<T = void> {
  private _code: string;
  private _status: number = 500;
  private _message: string | ((data: T) => string) = "An error occurred";

  constructor(code: string) {
    this._code = code;
  }

  status(status: number): this {
    this._status = status;
    return this;
  }

  message(message: string | ((data: T) => string)): this {
    this._message = message;
    return this;
  }

  data<NewT>(): ErrorBuilder<NewT> {
    const newBuilder = new ErrorBuilder<NewT>(this._code);
    newBuilder._status = this._status;
    // biome-ignore lint/suspicious/noExplicitAny: ...
    newBuilder._message = this._message as any;
    return newBuilder;
  }

  build(): ErrorFactory<T> {
    const code = this._code;
    const status = this._status;
    const messageOrFn = this._message;

    return ((data: T) => {
      const message =
        typeof messageOrFn === "function"
          ? (messageOrFn as (data: T) => string)(data)
          : messageOrFn;

      return new KitoError(code, status, message, data);
    }) as ErrorFactory<T>;
  }
}

export function error(code: string): ErrorBuilder<void> {
  return new ErrorBuilder(code);
}
