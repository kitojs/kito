import type { SchemaType } from "./base";

export interface BooleanSchema extends SchemaType {
  _type: boolean;
  optional(): OptionalBooleanSchema;
  default(value: boolean): DefaultBooleanSchema;
}

export interface OptionalBooleanSchema
  extends Omit<BooleanSchema, "optional" | "default"> {
  _optional: true;
  default(value: boolean): DefaultBooleanSchema;
}

export interface DefaultBooleanSchema
  extends Omit<BooleanSchema, "optional" | "default"> {
  _optional: true;
  _default: boolean;
}
