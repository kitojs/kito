import type { InferType, SchemaType } from "../schema/base";

export type CommonResponseHeaderNames =
  | "content-type"
  | "content-length"
  | "cache-control"
  | "etag"
  | "expires"
  | "last-modified"
  | "location"
  | "set-cookie"
  | "access-control-allow-origin"
  | "access-control-allow-methods"
  | "access-control-allow-headers"
  | "access-control-allow-credentials"
  | "vary"
  | "x-powered-by"
  | "x-frame-options"
  | "x-content-type-options"
  | "strict-transport-security";

export interface KitoResponse<TResponseSchema = unknown> {
  status(code: number): KitoResponse<TResponseSchema>;
  sendStatus(code: number): void;

  header(
    name: CommonResponseHeaderNames,
    value: string,
  ): KitoResponse<TResponseSchema>;
  header(name: string, value: string): KitoResponse<TResponseSchema>;

  headers(
    headers: Record<CommonResponseHeaderNames, string>,
  ): KitoResponse<TResponseSchema>;
  headers(headers: Record<string, string>): KitoResponse<TResponseSchema>;

  append(
    field: CommonResponseHeaderNames,
    value: string,
  ): KitoResponse<TResponseSchema>;
  append(field: string, value: string): KitoResponse<TResponseSchema>;

  set(
    field: CommonResponseHeaderNames,
    value: string,
  ): KitoResponse<TResponseSchema>;
  set(field: string, value: string): KitoResponse<TResponseSchema>;

  get(field: CommonResponseHeaderNames): string | undefined;
  get(field: string): string | undefined;

  type(contentType: string): KitoResponse<TResponseSchema>;
  contentType(contentType: string): KitoResponse<TResponseSchema>;

  cookie(
    name: string,
    value: string,
    options?: CookieOptions,
  ): KitoResponse<TResponseSchema>;
  clearCookie(
    name: string,
    options?: CookieOptions,
  ): KitoResponse<TResponseSchema>;

  send(
    data: TResponseSchema extends SchemaType
      ? InferType<TResponseSchema>
      : unknown,
  ): void;
  json(
    data: TResponseSchema extends SchemaType
      ? InferType<TResponseSchema>
      : unknown,
  ): void;

  text(data: string): void;
  html(data: string): void;
  redirect(url: string, code?: number): void;

  location(url: string): KitoResponse<TResponseSchema>;

  attachment(filename?: string): KitoResponse<TResponseSchema>;
  download(path: string, filename?: string): void;
  sendFile(path: string, options?: SendFileOptions): void;

  vary(field: string): KitoResponse<TResponseSchema>;
  links(links: Record<string, string>): KitoResponse<TResponseSchema>;
  format(obj: Record<string, () => void>): KitoResponse<TResponseSchema>;
}

export interface CookieOptions {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  secure?: boolean;
  signed?: boolean;
  sameSite?: boolean | "lax" | "strict" | "none";
}

export interface SendFileOptions {
  maxAge?: number;
  root?: string;
  lastModified?: boolean;
  headers?: Record<string, string>;
  dotfiles?: "allow" | "deny" | "ignore";
  acceptRanges?: boolean;
  cacheControl?: boolean;
  immutable?: boolean;
}
