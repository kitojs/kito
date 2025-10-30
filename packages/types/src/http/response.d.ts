export interface KitoResponse {
  status(code: number): KitoResponse;
  sendStatus(code: number): void;

  header(name: string, value: string): KitoResponse;
  headers(headers: Record<string, string>): KitoResponse;
  append(field: string, value: string): KitoResponse;
  set(field: string, value: string): KitoResponse;
  get(field: string): string | undefined;
  type(contentType: string): KitoResponse;
  contentType(contentType: string): KitoResponse;

  cookie(name: string, value: string, options?: CookieOptions): KitoResponse;
  clearCookie(name: string, options?: CookieOptions): KitoResponse;

  send(data: unknown): void;
  json(data: unknown): void;
  text(data: string): void;
  html(data: string): void;
  redirect(url: string, code?: number): void;

  location(url: string): KitoResponse;

  attachment(filename?: string): KitoResponse;
  download(path: string, filename?: string): void;
  sendFile(path: string, options?: SendFileOptions): void;

  vary(field: string): KitoResponse;
  links(links: Record<string, string>): KitoResponse;
  format(obj: Record<string, () => void>): KitoResponse;
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
