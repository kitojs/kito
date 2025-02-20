type KitoConfig = {};

interface KitoInterface {
  readonly config: KitoConfig;

  listen(
    options: { port: number; hostname?: string } | number,
    callback?: () => void,
  ): void;

  get(path: string, ...handlers: MiddlewareHandler[]): void;
  post(path: string, ...handlers: MiddlewareHandler[]): void;
  put(path: string, ...handlers: MiddlewareHandler[]): void;
  patch(path: string, ...handlers: MiddlewareHandler[]): void;
  delete(path: string, ...handlers: MiddlewareHandler[]): void;
  use(middleware: Middleware): void;
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

type Middleware = (
  req: Request,
  res: Response,
  next: () => void,
) => void | Promise<void>;

type MiddlewareHandler =
  | Middleware
  | ((req: Request, res: Response) => ArrayBuffer | void);

export type {
  KitoConfig,
  KitoInterface,
  Request,
  Response,
  Middleware,
  MiddlewareHandler,
};
