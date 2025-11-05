// biome-ignore assist/source/organizeImports: ...
import type {
  KitoResponse,
  CookieOptions,
  SendFileOptions,
} from "@kitojs/types";

import {
  setStatusResponse,
  setHeaderResponse,
  setHeadersResponse,
  appendHeaderResponse,
  setCookieResponse,
  setBodyBytes,
  setBodyString,
  setRedirectResponse,
  sendFileResponse,
  endResponse,
} from "@kitojs/kito-core";

const HTTP_STATUS_MESSAGES: Record<number, string> = {
  100: "Continue",
  101: "Switching Protocols",
  200: "OK",
  201: "Created",
  202: "Accepted",
  204: "No Content",
  301: "Moved Permanently",
  302: "Found",
  304: "Not Modified",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  500: "Internal Server Error",
  502: "Bad Gateway",
  503: "Service Unavailable",
};

export class ResponseBuilder implements KitoResponse {
  // biome-ignore lint/suspicious/noExplicitAny: ...
  private builder: any;
  private _headers: Map<string, string> = new Map();
  private finished = false;

  // biome-ignore lint/suspicious/noExplicitAny: ...
  constructor(responseBuilderCore: any) {
    this.builder = responseBuilderCore;
  }

  private checkFinished(): void {
    if (this.finished) {
      throw new Error("Response already sent");
    }
  }

  status(code: number): KitoResponse {
    this.checkFinished();

    setStatusResponse(this.builder, code);
    return this;
  }

  sendStatus(code: number): void {
    this.checkFinished();

    const message = HTTP_STATUS_MESSAGES[code] || "Unknown";
    setStatusResponse(this.builder, code);
    setBodyString(this.builder, message);
    endResponse(this.builder);

    this.finished = true;
  }

  header(name: string, value: string): KitoResponse {
    this.checkFinished();

    this._headers.set(name.toLowerCase(), value);
    setHeaderResponse(this.builder, name, value);
    return this;
  }

  headers(headers: Record<string, string>): KitoResponse {
    this.checkFinished();

    for (const [name, value] of Object.entries(headers)) {
      this._headers.set(name.toLowerCase(), value);
    }
    setHeadersResponse(this.builder, headers);
    return this;
  }

  append(field: string, value: string): KitoResponse {
    this.checkFinished();

    const key = field.toLowerCase();
    const existing = this._headers.get(key);

    if (existing) {
      const newValue = `${existing}, ${value}`;
      this._headers.set(key, newValue);
      appendHeaderResponse(this.builder, field, value);
    } else {
      this._headers.set(key, value);
      setHeaderResponse(this.builder, field, value);
    }

    return this;
  }

  set(field: string, value: string): KitoResponse {
    return this.header(field, value);
  }

  get(field: string): string | undefined {
    return this._headers.get(field.toLowerCase());
  }

  type(contentType: string): KitoResponse {
    this.checkFinished();

    if (!contentType.includes("/")) {
      const mimeTypes: Record<string, string> = {
        html: "text/html",
        json: "application/json",
        xml: "application/xml",
        text: "text/plain",
        txt: "text/plain",
        js: "application/javascript",
        css: "text/css",
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        gif: "image/gif",
        svg: "image/svg+xml",
        pdf: "application/pdf",
        zip: "application/zip",
      };

      contentType = mimeTypes[contentType] || contentType;
    }

    return this.header("Content-Type", contentType);
  }

  contentType(contentType: string): KitoResponse {
    return this.type(contentType);
  }

  cookie(name: string, value: string, options?: CookieOptions): KitoResponse {
    this.checkFinished();

    // biome-ignore lint/suspicious/noExplicitAny: ...
    setCookieResponse(this.builder, name, value, options as any);
    return this;
  }

  clearCookie(name: string, options?: CookieOptions): KitoResponse {
    this.checkFinished();

    const clearOptions = { ...options, maxAge: 0, expires: new Date(0) };
    // biome-ignore lint/suspicious/noExplicitAny: ...
    setCookieResponse(this.builder, name, "", clearOptions as any);
    return this;
  }

  // end methods

  send(data: unknown): void {
    this.checkFinished();
    if (Buffer.isBuffer(data)) {
      setBodyBytes(this.builder, data);
    } else if (typeof data === "string") {
      setBodyString(this.builder, data);
    } else {
      setBodyString(this.builder, String(data));
    }
    endResponse(this.builder);

    this.finished = true;
  }

  json(data: unknown): void {
    this.checkFinished();

    this.type("application/json");
    const jsonStr = JSON.stringify(data);
    setBodyString(this.builder, jsonStr);
    endResponse(this.builder);

    this.finished = true;
  }

  text(data: string): void {
    this.checkFinished();

    this.type("text/plain");
    setBodyString(this.builder, data);
    endResponse(this.builder);

    this.finished = true;
  }

  html(data: string): void {
    this.checkFinished();

    this.type("text/html");
    setBodyString(this.builder, data);
    endResponse(this.builder);

    this.finished = true;
  }

  redirect(url: string, code?: number): void {
    this.checkFinished();

    setRedirectResponse(this.builder, url, code);
    endResponse(this.builder);

    this.finished = true;
  }

  location(url: string): KitoResponse {
    this.checkFinished();

    return this.header("Location", url);
  }

  attachment(filename?: string): KitoResponse {
    this.checkFinished();

    if (filename) {
      const encodedFilename = encodeURIComponent(filename);
      return this.header(
        "Content-Disposition",
        `attachment; filename="${encodedFilename}"`,
      );
    }

    return this.header("Content-Disposition", "attachment");
  }

  download(path: string, filename?: string): void {
    this.checkFinished();

    const name = filename || path.split("/").pop() || "download";
    this.attachment(name);
    // biome-ignore lint/suspicious/noExplicitAny: ...
    sendFileResponse(this.builder, path, undefined as any);
    endResponse(this.builder);

    this.finished = true;
  }

  sendFile(path: string, options?: SendFileOptions): void {
    this.checkFinished();

    // biome-ignore lint/suspicious/noExplicitAny: ...
    sendFileResponse(this.builder, path, options as any);
    endResponse(this.builder);

    this.finished = true;
  }

  vary(field: string): KitoResponse {
    this.checkFinished();

    return this.append("Vary", field);
  }

  links(links: Record<string, string>): KitoResponse {
    this.checkFinished();

    const linkHeader = Object.entries(links)
      .map(([rel, url]) => `<${url}>; rel="${rel}"`)
      .join(", ");

    return this.header("Link", linkHeader);
  }

  format(obj: Record<string, () => void>): KitoResponse {
    this.checkFinished();

    const acceptHeader = this.get("accept") || "*/*";

    for (const [type, handler] of Object.entries(obj)) {
      if (acceptHeader.includes(type) || acceptHeader.includes("*/*")) {
        handler();
        return this;
      }
    }

    const firstHandler = Object.values(obj)[0];
    if (firstHandler) {
      firstHandler();
    }

    return this;
  }
}
