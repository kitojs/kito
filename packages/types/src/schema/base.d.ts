import type { RequestHeaders } from "../http/request";

export interface SchemaDefinition {
  params?: SchemaType;
  query?: SchemaType;
  body?: SchemaType;
  headers?: SchemaType;
}

export interface InferSchemaRequest<T extends SchemaDefinition> {
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
}

export interface SchemaType {
  _type: unknown;
  _optional: boolean;
  _default: unknown;
}

export type InferType<T extends SchemaType> = T extends {
  _optional: true;
  _default: infer D;
}
  ? D
  : T extends { _optional: true }
    ? T["_type"] | undefined
    : T["_type"];
