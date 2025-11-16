import type { LiteralSchema } from "@kitojs/types";

export class LiteralSchemaImpl<T extends string | number | boolean>
  implements LiteralSchema<T>
{
  _type!: T;
  _optional = false;
  _default: unknown = undefined;

  constructor(private value: T) {}

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
  default(value: T): any {
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
      type: "literal",
      optional: this._optional,
      default: this._default,
      value: this.value,
    };
  }
}
