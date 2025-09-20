import type { SchemaType } from "./base";

export interface StringSchema extends SchemaType {
  _type: string;
  min(length: number): StringSchema;
  max(length: number): StringSchema;
  length(length: number): StringSchema;
  email(): StringSchema;
  url(): StringSchema;
  uuid(): StringSchema;
  regex(pattern: RegExp): StringSchema;
  optional(): OptionalStringSchema;
  default(value: string): DefaultStringSchema;
}

export interface OptionalStringSchema
  extends Omit<StringSchema, "optional" | "default"> {
  _optional: true;
  default(value: string): DefaultStringSchema;
}

export interface DefaultStringSchema
  extends Omit<StringSchema, "optional" | "default"> {
  _optional: true;
  _default: string;
}
