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
  raw: {
    body: Buffer;
    headers: RequestHeaders;
    url: string;
    method: string;
  };
}
