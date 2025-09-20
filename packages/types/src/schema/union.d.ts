import type { InferType, SchemaType } from "./base";

export interface UnionSchema<T extends SchemaType[]> extends SchemaType {
  _type: InferType<T[number]>;
  optional(): OptionalUnionSchema<T>;
  default(value: InferType<T[number]>): DefaultUnionSchema<T>;
}

export interface OptionalUnionSchema<T extends SchemaType[]>
  extends Omit<UnionSchema<T>, "optional" | "default"> {
  _optional: true;
  default(value: InferType<T[number]>): DefaultUnionSchema<T>;
}

export interface DefaultUnionSchema<T extends SchemaType[]>
  extends Omit<UnionSchema<T>, "optional" | "default"> {
  _optional: true;
  _default: InferType<T[number]>;
}
