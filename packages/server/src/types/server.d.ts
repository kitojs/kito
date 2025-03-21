type ServerConfig = {};

interface ServerInterface {
  readonly config: ServerConfig;

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

interface Request<TParams = any> {
  params: TParams;
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

interface Response<TBody = any> {
  send(body: TBody): Response<TBody>;
  json(body: TBody): Response<TBody>;
  status(code: number): Response<TBody>;
  header(key: string, value: string): Response<TBody>;
  cookie(name: string, value: string, options?: CookieOptions): Response<TBody>;
  redirect(url: string): Response<TBody>;
  type(mime: string): Response<TBody>;
  append(key: string, value: string): Response<TBody>;
  sendStatus(code: number): Response<TBody>;
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
  ServerConfig,
  ServerInterface,
  Request,
  Response,
  Middleware,
  MiddlewareHandler,
};
