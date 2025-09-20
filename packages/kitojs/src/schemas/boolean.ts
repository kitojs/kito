import type { BooleanSchema } from "@kitojs/types";

export class BooleanSchemaImpl implements BooleanSchema {
  _type!: boolean;
  _optional = false;
  _default: unknown = undefined;

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
  default(value: boolean): any {
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
      type: "boolean",
      optional: this._optional,
      default: this._default,
    };
  }
}
