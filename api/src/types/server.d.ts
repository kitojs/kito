type KitoConfig = {};

interface KitoInterface {
  readonly config: KitoConfig;

  listen(
    options: { port: number; hostname?: string } | number,
    callback?: () => void,
  ): void;

  get(
    path: string,
    callback: (req: Request, res: Response) => ArrayBuffer | void,
  ): void;
  post(
    path: string,
    callback: (req: Request, res: Response) => ArrayBuffer | void,
  ): void;
  put(
    path: string,
    callback: (req: Request, res: Response) => ArrayBuffer | void,
  ): void;
  patch(
    path: string,
    callback: (req: Request, res: Response) => ArrayBuffer | void,
  ): void;
  delete(
    path: string,
    callback: (req: Request, res: Response) => ArrayBuffer | void,
  ): void;
}

interface Request {
  params: Record<string, string>;
  query: Record<string, string | string[]>;
  body: any;
  headers: Record<string, string>;
  method: string;
  url: string;
}

interface CookieOptions {
  maxAge?: number;
  domain?: string;
  path?: string;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: boolean | 'lax' | 'strict' | 'none';
}

interface Response {
  send(body: string | object): Response;
  json(body: object): Response;
  status(code: number): Response;
  header(key: string, value: string): Response;
  cookie(name: string, value: string, options?: CookieOptions): Response;
  redirect(url: string): Response;
  type(mime: string): Response;
  append(key: string, value: string): Response;
  sendStatus(code: number): Response;
  end(): void;
}

export type { KitoConfig, KitoInterface, Request, Response };
