type KitoConfig = {};

interface KitoInterface {
  readonly config: KitoConfig;

  listen(
    options: { port: number; hostname?: string } | number,
    callback?: () => void,
  ): void;

  get(path: string, callback: (req: Request, res: Response) => void): void;
  post(path: string, callback: (req: Request, res: Response) => void): void;
  put(path: string, callback: (req: Request, res: Response) => void): void;
  patch(path: string, callback: (req: Request, res: Response) => void): void;
  delete(path: string, callback: (req: Request, res: Response) => void): void;
}

interface Request {
  params: Record<string, string>;
  query: Record<string, string | string[]>;
  body: any;
  headers: Record<string, string>;
  method: string;
  url: string;
}

interface Response {
  send(body: string | object): void;
  json(body: object): void;
  status(code: number): Response;
  header(key: string, value: string): Response;
}

export { KitoConfig, KitoInterface, Request, Response };
