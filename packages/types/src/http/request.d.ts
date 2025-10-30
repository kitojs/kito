export interface RequestHeaders {
  [key: string]: string | string[] | undefined;
}

export interface ParsedUrl {
  pathname: string;
  search: string | null;
  query: Record<string, string | string[]>;
}

export interface KitoRequest {
  method: string;
  url: string;
  headers: RequestHeaders;
  params: Record<string, string>;
  query: Record<string, string | string[]>;
  body: unknown;

  pathname: string;
  search: string | null;
  protocol: string;
  hostname: string;
  cookies: Record<string, string>;
  ip: string;
  ips: string[];
  originalUrl: string;
  secure: boolean;
  xhr: boolean;

  raw: {
    body: Buffer;
    headers: RequestHeaders;
    url: string;
    method: string;
  };
}
