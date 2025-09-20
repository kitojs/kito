import type { SchemaType } from "./base";

export interface LiteralSchema<T extends string | number | boolean>
  extends SchemaType {
  _type: T;
  optional(): OptionalLiteralSchema<T>;
  default(value: T): DefaultLiteralSchema<T>;
}

export interface OptionalLiteralSchema<T extends string | number | boolean>
  extends Omit<LiteralSchema<T>, "optional" | "default"> {
  _optional: true;
  default(value: T): DefaultLiteralSchema<T>;
}

export interface DefaultLiteralSchema<T extends string | number | boolean>
  extends Omit<LiteralSchema<T>, "optional" | "default"> {
  _optional: true;
  _default: T;
}
