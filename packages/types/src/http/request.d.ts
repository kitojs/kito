export type CommonHeaderNames =
  | "accept"
  | "accept-encoding"
  | "accept-language"
  | "authorization"
  | "cache-control"
  | "content-type"
  | "content-length"
  | "cookie"
  | "host"
  | "origin"
  | "referer"
  | "user-agent"
  | "x-forwarded-for"
  | "x-forwarded-host"
  | "x-forwarded-proto"
  | "x-requested-with";

export interface RequestHeaders
  extends Record<string, string | string[] | undefined> {
  accept?: string;
  "accept-encoding"?: string;
  "accept-language"?: string;
  authorization?: string;
  "cache-control"?: string;
  "content-type"?: string;
  "content-length"?: string;
  cookie?: string;
  host?: string;
  origin?: string;
  referer?: string;
  "user-agent"?: string;
  "x-forwarded-for"?: string;
  "x-forwarded-host"?: string;
  "x-forwarded-proto"?: string;
  "x-requested-with"?: string;
}

export interface ParsedUrl {
  pathname: string;
  search: string | null;
  query: Record<string, string | string[]>;
}

export interface KitoRequest {
  get method(): string;
  get url(): string;

  get headers(): RequestHeaders;

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

  header(name: CommonHeaderNames): string | undefined;
  header(name: string): string | undefined;

  queryParam(name: string): string | string[] | undefined;
  param(name: string): string | undefined;
  cookie(name: string): string | undefined;

  json<T = unknown>(): T;
  text(): string;

  get raw(): {
    body: Buffer;
    headers: RequestHeaders;
    url: string;
    method: string;
  };
}
