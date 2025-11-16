import type { InferType, SchemaType } from "./base";

export interface ArraySchema<T extends SchemaType> extends SchemaType {
  _type: InferType<T>[];
  min(length: number): ArraySchema<T>;
  max(length: number): ArraySchema<T>;
  length(length: number): ArraySchema<T>;
  optional(): OptionalArraySchema<T>;
  default(value: InferType<T>[]): DefaultArraySchema<T>;
}

export interface OptionalArraySchema<T extends SchemaType>
  extends Omit<ArraySchema<T>, "optional" | "default"> {
  _optional: true;
  default(value: InferType<T>[]): DefaultArraySchema<T>;
}

export interface DefaultArraySchema<T extends SchemaType>
  extends Omit<ArraySchema<T>, "optional" | "default"> {
  _optional: true;
  _default: InferType<T>[];
}
