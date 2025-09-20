import type { ArraySchema, SchemaType } from "@kitojs/types";

export class ArraySchemaImpl<T extends SchemaType> implements ArraySchema<T> {
  // biome-ignore lint/suspicious/noExplicitAny: ...
  _type!: any[];
  _optional = false;
  _default: unknown = undefined;
  // biome-ignore lint/suspicious/noExplicitAny: ...
  private constraints: any[] = [];

  constructor(private item: T) {}

  min(length: number): ArraySchema<T> {
    this.constraints.push({ type: "min", value: length });
    return this;
  }

  max(length: number): ArraySchema<T> {
    this.constraints.push({ type: "max", value: length });
    return this;
  }

  length(length: number): ArraySchema<T> {
    this.constraints.push({ type: "length", value: length });
    return this;
  }

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
  default(value: any[]): any {
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
      type: "array",
      optional: this._optional,
      default: this._default,
      constraints: this.constraints,
      // biome-ignore lint/suspicious/noExplicitAny: ...
      item: (this.item as any)._serialize(),
    };
  }
}
