// biome-ignore assist/source/organizeImports: ...
import type {
  CommonHeaderNames,
  KitoRequest,
  RequestHeaders,
} from "@kitojs/types";
import {
  getBodyBuffer,
  getHeader,
  getAllHeaders,
  getQueryParam,
  getAllQuery,
  getParam,
  getAllParams,
  getCookie,
  getAllCookies,
  getMethod,
  getUrl,
  getPathname,
  getSearch,
  getProtocol,
  getHostname,
  getIp,
  getIps,
  getSecure,
  getXhr,
} from "@kitojs/kito-core";

export class RequestBuilder implements KitoRequest {
  // biome-ignore lint/suspicious/noExplicitAny: ...
  private core: any;

  private _body?: Buffer;
  private _headers?: Record<string, string>;
  private _query?: Record<string, string | string[]>;
  private _params?: Record<string, string>;
  private _cookies?: Record<string, string>;
  private _method?: string;
  private _url?: string;
  private _pathname?: string;
  private _search?: string | null;
  private _protocol?: string;
  private _hostname?: string;
  private _ip?: string;
  private _ips?: string[];
  private _secure?: boolean;
  private _xhr?: boolean;

  // biome-ignore lint/suspicious/noExplicitAny: ...
  constructor(requestCore: any) {
    this.core = requestCore;
  }

  get body(): Buffer {
    if (!this._body) {
      this._body = getBodyBuffer(this.core);
    }
    return this._body;
  }

  json<T = unknown>(): T {
    return JSON.parse(this.body.toString("utf-8"));
  }

  text(): string {
    return this.body.toString("utf-8");
  }

  get headers(): RequestHeaders {
    if (!this._headers) {
      this._headers = getAllHeaders(this.core);
    }
    return this._headers;
  }

  header(name: CommonHeaderNames): string | undefined;
  header(name: string): string | undefined;
  header(name: string): string | undefined {
    const value = getHeader(this.core, name.toLowerCase());
    return value ?? undefined;
  }

  get query(): Record<string, string | string[]> {
    if (!this._query) {
      this._query = getAllQuery(this.core);
    }
    return this._query;
  }

  queryParam(name: string): string | string[] | undefined {
    const value = getQueryParam(this.core, name);
    if (!value) return undefined;
    return value.length === 1 ? value[0] : value;
  }

  get params(): Record<string, string> {
    if (!this._params) {
      this._params = getAllParams(this.core);
    }
    return this._params;
  }

  param(name: string): string | undefined {
    return getParam(this.core, name) ?? undefined;
  }

  get cookies(): Record<string, string> {
    if (!this._cookies) {
      this._cookies = getAllCookies(this.core);
    }
    return this._cookies;
  }

  cookie(name: string): string | undefined {
    return getCookie(this.core, name) ?? undefined;
  }

  get method(): string {
    if (!this._method) {
      this._method = getMethod(this.core);
    }
    return this._method;
  }

  get url(): string {
    if (!this._url) {
      this._url = getUrl(this.core);
    }
    return this._url;
  }

  get pathname(): string {
    if (!this._pathname) {
      this._pathname = getPathname(this.core);
    }
    return this._pathname;
  }

  get search(): string | null {
    if (this._search === undefined) {
      this._search = getSearch(this.core) ?? null;
    }
    return this._search;
  }

  get protocol(): string {
    if (!this._protocol) {
      this._protocol = getProtocol(this.core);
    }
    return this._protocol;
  }

  get hostname(): string {
    if (!this._hostname) {
      this._hostname = getHostname(this.core);
    }
    return this._hostname;
  }

  get ip(): string {
    if (!this._ip) {
      this._ip = getIp(this.core);
    }
    return this._ip;
  }

  get ips(): string[] {
    if (!this._ips) {
      this._ips = getIps(this.core);
    }
    return this._ips;
  }

  get secure(): boolean {
    if (this._secure === undefined) {
      this._secure = getSecure(this.core);
    }
    return this._secure;
  }

  get xhr(): boolean {
    if (this._xhr === undefined) {
      this._xhr = getXhr(this.core);
    }
    return this._xhr;
  }

  get originalUrl(): string {
    return this.url;
  }

  get raw(): {
    body: Buffer;
    headers: RequestHeaders;
    url: string;
    method: string;
  } {
    return {
      body: this.body,
      headers: this.headers,
      url: this.url,
      method: this.method,
    };
  }
}
