type InferType<T extends SchemaType> = T extends { type: 'string' }
  ? string
  : T extends { type: 'number' }
    ? number
    : T extends { type: 'boolean' }
      ? boolean
      : T extends { type: 'object'; properties: infer P }
        ? { [K in keyof P]: P[K] extends SchemaType ? InferType<P[K]> : never }
        : T extends { type: 'array'; items: infer I }
          ? I extends SchemaType
            ? InferType<I>[]
            : never
          : never;

type SchemaType =
  | { type: 'string' }
  | { type: 'number' }
  | { type: 'boolean' }
  | { type: 'object'; properties: Record<string, SchemaType> }
  | { type: 'array'; items: SchemaType };

class RouteBuilder<
  TParams extends Record<string, SchemaType> | undefined = undefined,
  TResponse extends SchemaType | undefined = undefined,
> {
  private _path: string;
  private _paramsSchema?: TParams;
  private _responseSchema?: TResponse;

  constructor(path: string) {
    this._path = path;
  }

  params<T extends Record<string, SchemaType>>(
    schema: T,
  ): RouteBuilder<T, TResponse> {
    this._paramsSchema = schema as any;
    return this as any;
  }

  response<T extends SchemaType>(schema: T): RouteBuilder<TParams, T> {
    this._responseSchema = schema as any;
    return this as any;
  }

  getPath(): string {
    return this._path;
  }

  getSchemas(): { params: TParams; response: TResponse } {
    return {
      params: this._paramsSchema,
      response: this._responseSchema,
    } as any;
  }
}

function route(path: string): RouteBuilder {
  return new RouteBuilder(path);
}

const t = {
  string: () => ({ type: 'string' }) as const,
  number: () => ({ type: 'number' }) as const,
  boolean: () => ({ type: 'boolean' }) as const,
  object: <T extends Record<string, SchemaType>>(properties: T) =>
    ({ type: 'object', properties }) as const,
  array: <T extends SchemaType>(itemSchema: T) =>
    ({ type: 'array', items: itemSchema }) as const,
};

export { route, t, type InferType, SchemaType, RouteBuilder };
