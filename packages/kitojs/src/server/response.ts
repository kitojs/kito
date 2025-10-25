// biome-ignore assist/source/organizeImports: ...
import type { KitoResponse, CookieOptions } from "@kitojs/types";

import {
  setStatusResponse,
  setHeaderResponse,
  setHeadersResponse,
  setCookieResponse,
  // setClearCookieResponse,
  setSendResponse,
  setJsonResponse,
  setTextResponse,
  setHtmlResponse,
  setRedirectResponse,
  endResponse,
} from "@kitojs/kito-core";

export class ResponseBuilder implements KitoResponse {
  // biome-ignore lint/suspicious/noExplicitAny: ...
  private builder: any;

  // biome-ignore lint/suspicious/noExplicitAny: ...
  constructor(responseBuilderCore: any) {
    this.builder = responseBuilderCore;
  }

  status(code: number): KitoResponse {
    setStatusResponse(this.builder, code);
    return this;
  }

  header(name: string, value: string): KitoResponse {
    setHeaderResponse(this.builder, name, value);
    return this;
  }

  headers(headers: Record<string, string>): KitoResponse {
    setHeadersResponse(this.builder, headers);
    return this;
  }

  cookie(name: string, value: string, options?: CookieOptions): KitoResponse {
    // biome-ignore lint/suspicious/noExplicitAny: ...
    setCookieResponse(this.builder, name, value, options as any);
    return this;
  }

  clearCookie(_name: string, _options?: CookieOptions): KitoResponse {
    // setClearCookieResponse(this.builder, name, options);
    return this;
  }

  // end methods

  send(data: unknown): void {
    setSendResponse(this.builder, data);
    endResponse(this.builder);
  }

  json(data: unknown): void {
    setJsonResponse(this.builder, JSON.stringify(data));
    endResponse(this.builder);
  }

  text(data: string): void {
    setTextResponse(this.builder, data);
    endResponse(this.builder);
  }

  html(data: string): void {
    setHtmlResponse(this.builder, data);
    endResponse(this.builder);
  }

  redirect(url: string, code?: number): void {
    setRedirectResponse(this.builder, url, code);
    endResponse(this.builder);
  }
}
