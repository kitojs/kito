// biome-ignore assist/source/organizeImports: ...
import type {
  KitoResponse,
  CookieOptions,
  SendFileOptions,
  CommonResponseHeaderNames,
  StreamWriter,
  SSEWriter,
} from "@kitojs/types";

import {
  sendResponse,
  startStream,
  sendChunk,
  endStream,
} from "@kitojs/kito-core";
import { readFileSync, statSync } from "node:fs";

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

interface ResponseState {
  status: number;
  headers: Map<string, string>;
  body?: Buffer;
  streaming: boolean;
}

class StreamWriterImpl implements StreamWriter {
  // biome-ignore lint/suspicious/noExplicitAny: ...
  constructor(private channel: any) {}

  write(data: string | Buffer): void {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, "utf-8");
    sendChunk(this.channel, buffer);
  }

  end(data?: string | Buffer): void {
    if (data !== undefined) {
      this.write(data);
    }

    endStream(this.channel);
  }
}

class SSEWriterImpl implements SSEWriter {
  // biome-ignore lint/suspicious/noExplicitAny: ...
  constructor(private channel: any) {}

  send(data: unknown, event?: string, id?: string, retry?: number): void {
    let message = "";

    if (event) {
      message += `event: ${event}\n`;
    }

    if (id) {
      message += `id: ${id}\n`;
    }

    if (retry !== undefined) {
      message += `retry: ${retry}\n`;
    }

    const dataStr = typeof data === "string" ? data : JSON.stringify(data);
    const lines = dataStr.split("\n");

    for (const line of lines) {
      message += `data: ${line}\n`;
    }

    message += "\n";

    sendChunk(this.channel, Buffer.from(message, "utf-8"));
  }

  comment(text: string): void {
    const message = `: ${text}\n\n`;
    sendChunk(this.channel, Buffer.from(message, "utf-8"));
  }

  close(): void {
    endStream(this.channel);
  }
}

export class ResponseBuilder implements KitoResponse {
  // biome-ignore lint/suspicious/noExplicitAny: ...
  private channel: any;
  private state: ResponseState;
  private finished = false;

  // biome-ignore lint/suspicious/noExplicitAny: ...
  constructor(responseChannel: any) {
    this.channel = responseChannel;
    this.state = {
      status: 200,
      headers: new Map(),
      streaming: false,
    };
  }

  private checkFinished(): void {
    if (this.finished) {
      throw new Error("Response already sent");
    }
  }

  private serializeAndSend(): void {
    const headersArray = Array.from(this.state.headers.entries());
    const headersJson = JSON.stringify(headersArray);
    const headersBytes = Buffer.from(headersJson, "utf-8");

    const body = this.state.body || Buffer.alloc(0);

    const totalSize = 2 + 4 + headersBytes.length + body.length;
    const buffer = Buffer.allocUnsafe(totalSize);

    let offset = 0;

    buffer.writeUInt16LE(this.state.status, offset);
    offset += 2;

    buffer.writeUInt32LE(headersBytes.length, offset);
    offset += 4;

    headersBytes.copy(buffer, offset);
    offset += headersBytes.length;

    if (body.length > 0) {
      body.copy(buffer, offset);
    }

    sendResponse(this.channel, buffer);
    this.finished = true;
  }

  private startStreamingResponse(): void {
    const headersArray = Array.from(this.state.headers.entries());
    const headersJson = JSON.stringify(headersArray);
    const headersBytes = Buffer.from(headersJson, "utf-8");

    const totalSize = 2 + 4 + headersBytes.length;
    const buffer = Buffer.allocUnsafe(totalSize);

    let offset = 0;

    buffer.writeUInt16LE(this.state.status, offset);
    offset += 2;

    buffer.writeUInt32LE(headersBytes.length, offset);
    offset += 4;

    headersBytes.copy(buffer, offset);

    startStream(this.channel, buffer);
    this.state.streaming = true;
    this.finished = true;
  }

  status(code: number): KitoResponse {
    this.checkFinished();
    this.state.status = code;
    return this;
  }

  sendStatus(code: number): void {
    this.checkFinished();
    const message = HTTP_STATUS_MESSAGES[code] || "Unknown";
    this.state.status = code;
    this.state.body = Buffer.from(message, "utf-8");
    this.serializeAndSend();
  }

  header(name: CommonResponseHeaderNames, value: string): KitoResponse;
  header(name: string, value: string): KitoResponse;
  header(name: string, value: string): KitoResponse {
    this.checkFinished();

    this.state.headers.set(name.toLowerCase(), value);
    return this;
  }

  headers(headers: Record<CommonResponseHeaderNames, string>): KitoResponse;
  headers(headers: Record<string, string>): KitoResponse;
  headers(headers: Record<string, string>): KitoResponse {
    this.checkFinished();

    for (const [name, value] of Object.entries(headers)) {
      this.state.headers.set(name.toLowerCase(), value);
    }
    return this;
  }

  append(field: CommonResponseHeaderNames, value: string): KitoResponse;
  append(field: string, value: string): KitoResponse;
  append(field: string, value: string): KitoResponse {
    this.checkFinished();

    const key = field.toLowerCase();
    const existing = this.state.headers.get(key);

    if (existing) {
      this.state.headers.set(key, `${existing}, ${value}`);
    } else {
      this.state.headers.set(key, value);
    }

    return this;
  }

  set(field: CommonResponseHeaderNames, value: string): KitoResponse;
  set(field: string, value: string): KitoResponse;
  set(field: string, value: string): KitoResponse {
    return this.header(field, value);
  }

  get(field: CommonResponseHeaderNames): string | undefined;
  get(field: string): string | undefined;
  get(field: string): string | undefined {
    return this.state.headers.get(field.toLowerCase());
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

    return this.header("content-type", contentType);
  }

  contentType(contentType: string): KitoResponse {
    return this.type(contentType);
  }

  cookie(name: string, value: string, options?: CookieOptions): KitoResponse {
    this.checkFinished();

    const cookie = this.serializeCookie(name, value, options);

    const existing = this.state.headers.get("set-cookie");
    if (existing) {
      this.state.headers.set("set-cookie", `${existing}, ${cookie}`);
    } else {
      this.state.headers.set("set-cookie", cookie);
    }

    return this;
  }

  private serializeCookie(
    name: string,
    value: string,
    options?: CookieOptions,
  ): string {
    let cookie = `${name}=${value}`;

    if (options?.maxAge !== undefined) {
      cookie += `; Max-Age=${options.maxAge}`;
    }

    if (options?.path) {
      cookie += `; Path=${options.path}`;
    } else {
      cookie += "; Path=/";
    }

    if (options?.domain) {
      cookie += `; Domain=${options.domain}`;
    }

    if (options?.httpOnly) {
      cookie += "; HttpOnly";
    }

    if (options?.secure) {
      cookie += "; Secure";
    }

    if (options?.sameSite) {
      const sameSite =
        typeof options.sameSite === "string"
          ? options.sameSite
          : options.sameSite
            ? "Strict"
            : "Lax";
      cookie += `; SameSite=${sameSite}`;
    }

    return cookie;
  }

  clearCookie(name: string, options?: CookieOptions): KitoResponse {
    this.checkFinished();

    const clearOptions = { ...options, maxAge: 0, expires: new Date(0) };
    return this.cookie(name, "", clearOptions);
  }

  // end methods

  end(): void {
    this.checkFinished();
    this.serializeAndSend();
  }

  send(data: unknown): void {
    this.checkFinished();
    if (Buffer.isBuffer(data)) {
      this.state.body = data;
    } else if (typeof data === "string") {
      this.state.body = Buffer.from(data, "utf-8");
    } else {
      this.state.body = Buffer.from(String(data), "utf-8");
    }

    this.serializeAndSend();
  }

  json(data: unknown): void {
    this.checkFinished();

    this.type("application/json");
    const jsonStr = JSON.stringify(data);
    this.state.body = Buffer.from(jsonStr, "utf-8");
    this.serializeAndSend();
  }

  text(data: string): void {
    this.checkFinished();

    this.type("text/plain");
    this.state.body = Buffer.from(data, "utf-8");
    this.serializeAndSend();
  }

  html(data: string): void {
    this.checkFinished();

    this.type("text/html");
    this.state.body = Buffer.from(data, "utf-8");
    this.serializeAndSend();
  }

  redirect(url: string, code?: number): void {
    this.checkFinished();

    this.state.status = code || 302;
    this.header("location", url);
    this.serializeAndSend();
  }

  location(url: string): KitoResponse {
    this.checkFinished();

    return this.header("location", url);
  }

  attachment(filename?: string): KitoResponse {
    this.checkFinished();

    if (filename) {
      const encodedFilename = encodeURIComponent(filename);
      return this.header(
        "content-disposition",
        `attachment; filename="${encodedFilename}"`,
      );
    }

    return this.header("content-disposition", "attachment");
  }

  download(path: string, filename?: string, options?: SendFileOptions): void {
    const name = filename || path.split("/").pop() || "download";

    this.attachment(name);
    this.sendFile(path, options);
  }

  sendFile(path: string, options: SendFileOptions = {}): void {
    this.checkFinished();

    try {
      const fullPath = options.root ? `${options.root}/${path}` : path;
      const stats = statSync(fullPath);

      this.state.body = readFileSync(fullPath);

      const mimeType = this.getMimeType(path);
      this.type(mimeType);

      if (options.headers) {
        this.headers(options.headers);
      }

      if (options.acceptRanges) {
        this.header("accept-ranges", "bytes");
      }

      if (options.cacheControl !== false) {
        const maxAge = options.maxAge || 0;
        let cacheControl = `public, max-age=${Math.floor(maxAge / 1000)}`;

        if (options.immutable) {
          cacheControl += ", immutable";
        }

        this.header("cache-control", cacheControl);
      }

      if (options.lastModified !== false) {
        this.header("last-modified", stats.mtime.toUTCString());
      }

      if (options.etag !== false) {
        const etag = `W/"${stats.size.toString(16)}-${stats.mtime.getTime().toString(16)}"`;
        this.header("etag", etag);
      }

      this.serializeAndSend();
    } catch (_) {
      this.state.status = 404;
      this.state.body = Buffer.from("File Not Found", "utf-8");
      this.serializeAndSend();
    }
  }

  private getMimeType(path: string): string {
    const extension = path.split(".").pop()?.toLowerCase() || "";

    const mimeTypes: Record<string, string> = {
      html: "text/html",
      htm: "text/html",
      css: "text/css",
      js: "application/javascript",
      mjs: "application/javascript",
      json: "application/json",
      xml: "application/xml",
      txt: "text/plain",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      svg: "image/svg+xml",
      webp: "image/webp",
      ico: "image/x-icon",
      pdf: "application/pdf",
      zip: "application/zip",
      wasm: "application/wasm",
      mp4: "video/mp4",
      webm: "video/webm",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      woff: "font/woff2",
      woff2: "font/woff2",
      ttf: "font/ttf",
      otf: "font/otf",
    };

    return mimeTypes[extension] || "application/octet-stream";
  }

  vary(field: string): KitoResponse {
    this.checkFinished();

    return this.append("vary", field);
  }

  links(links: Record<string, string>): KitoResponse {
    this.checkFinished();

    const linkHeader = Object.entries(links)
      .map(([rel, url]) => `<${url}>; rel="${rel}"`)
      .join(", ");

    return this.header("link", linkHeader);
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

  stream(): StreamWriter {
    this.checkFinished();

    if (!this.state.headers.has("content-type")) {
      this.type("application/octet-stream");
    }

    this.startStreamingResponse();

    return new StreamWriterImpl(this.channel);
  }

  sse(): SSEWriter {
    this.checkFinished();

    this.type("text/event-stream");
    this.header("cache-control", "no-cache");
    this.header("connection", "keep-alive");

    this.startStreamingResponse();

    return new SSEWriterImpl(this.channel);
  }
}
