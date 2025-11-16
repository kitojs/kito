import type { RequestHeaders } from "../http/request";

export interface SchemaDefinition {
  params?: SchemaType;
  query?: SchemaType;
  body?: SchemaType;
  headers?: SchemaType;
  response?: ResponseSchemaDefinition;
}

export interface ResponseSchemaDefinition {
  [statusCode: number]: SchemaType;
}

export type InferSchemaRequest<T extends SchemaDefinition> = {
  params: T["params"] extends SchemaType
    ? InferType<T["params"]>
    : Record<string, string>;
  query: T["query"] extends SchemaType
    ? InferType<T["query"]>
    : Record<string, string | string[]>;
  body: T["body"] extends SchemaType ? InferType<T["body"]> : unknown;
  headers: T["headers"] extends SchemaType
    ? InferType<T["headers"]>
    : RequestHeaders;
};

export interface SchemaType {
  _type: unknown;
  _optional: boolean;
  _default?: unknown;
  // biome-ignore lint/suspicious/noExplicitAny: ...
  _serialize?(): any;
}

export type InferType<T extends SchemaType> = T extends { _default: infer D }
  ? D
  : T extends { _optional: true }
    ? T["_type"] | undefined
    : T["_type"];
