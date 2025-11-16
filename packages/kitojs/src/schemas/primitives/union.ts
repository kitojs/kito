import type { SchemaType, UnionSchema } from "@kitojs/types";

export class UnionSchemaImpl<T extends SchemaType[]> implements UnionSchema<T> {
  // biome-ignore lint/suspicious/noExplicitAny: ...
  _type!: any;
  _optional = false;
  _default: unknown = undefined;

  constructor(private schemas: T) {}

  // biome-ignore lint/suspicious/noExplicitAny: ...
  optional(): any {
    const clone = Object.assign(
      Object.create(Object.getPrototypeOf(this)),
      this,
    );
    clone._optional = true;
    return clone;
  }

  // biome-ignore lint/suspicious/noExplicitAny: ...
  default(value: any): any {
    const clone = Object.assign(
      Object.create(Object.getPrototypeOf(this)),
      this,
    );
    clone._optional = true;
    clone._default = value;
    return clone;
  }

  _serialize() {
    return {
      type: "union",
      optional: this._optional,
      default: this._default,
      // biome-ignore lint/suspicious/noExplicitAny: ...
      schemas: this.schemas.map((s) => (s as any)._serialize()),
    };
  }
}
