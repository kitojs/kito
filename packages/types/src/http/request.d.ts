export interface RequestHeaders {
  [key: string]: string | string[] | undefined;
}

export interface ParsedUrl {
  pathname: string;
  search: string | null;
  query: Record<string, string | string[]>;
}

export interface KitoRequest {
  get method(): string;
  get url(): string;
  get headers(): Record<string, string>;
  get body(): unknown;
  get params(): Record<string, string>;
  get query(): Record<string, string | string[]>;
  get cookies(): Record<string, string>;
  get pathname(): string;
  get search(): string | null;
  get protocol(): string;
  get hostname(): string;
  get ip(): string;
  get ips(): string[];
  get secure(): boolean;
  get xhr(): boolean;
  get originalUrl(): string;

  header(name: string): string | undefined;
  queryParam(name: string): string | string[] | undefined;
  param(name: string): string | undefined;
  cookie(name: string): string | undefined;

  json<T = unknown>(): T;
  text(): string;

  get raw(): {
    body: Buffer;
    headers: Record<string, string>;
    url: string;
    method: string;
  };
}
