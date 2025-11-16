import type { SchemaType } from "./base";

export interface NumberSchema extends SchemaType {
  _type: number;
  min(value: number): NumberSchema;
  max(value: number): NumberSchema;
  int(): NumberSchema;
  positive(): NumberSchema;
  negative(): NumberSchema;
  optional(): OptionalNumberSchema;
  default(value: number): DefaultNumberSchema;
}

export interface OptionalNumberSchema
  extends Omit<NumberSchema, "optional" | "default"> {
  _optional: true;
  default(value: number): DefaultNumberSchema;
}

export interface DefaultNumberSchema
  extends Omit<NumberSchema, "optional" | "default"> {
  _optional: true;
  _default: number;
}
