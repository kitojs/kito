import type { InferType, SchemaType } from "./base";

export interface ObjectSchema<T extends Record<string, SchemaType>>
  extends SchemaType {
  _type: { [K in keyof T]: InferType<T[K]> };
  shape: T;
  optional(): OptionalObjectSchema<T>;
  default(value: { [K in keyof T]: InferType<T[K]> }): DefaultObjectSchema<T>;
}

export interface OptionalObjectSchema<T extends Record<string, SchemaType>>
  extends Omit<ObjectSchema<T>, "optional" | "default"> {
  _optional: true;
  default(value: { [K in keyof T]: InferType<T[K]> }): DefaultObjectSchema<T>;
}

export interface DefaultObjectSchema<T extends Record<string, SchemaType>>
  extends Omit<ObjectSchema<T>, "optional" | "default"> {
  _optional: true;
  _default: { [K in keyof T]: InferType<T[K]> };
}
