export interface KitoResponse {
  status(code: number): KitoResponse;
  header(name: string, value: string): KitoResponse;
  headers(headers: Record<string, string>): KitoResponse;
  send(data: unknown): void;
  json(data: unknown): void;
  text(data: string): void;
  html(data: string): void;
  redirect(url: string, code?: number): void;
  cookie(name: string, value: string, options?: CookieOptions): KitoResponse;
  clearCookie(name: string, options?: CookieOptions): KitoResponse;
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
