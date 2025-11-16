import type { InferType, ObjectSchema, SchemaType } from "@kitojs/types";

export class ObjectSchemaImpl<T extends Record<string, SchemaType>>
  implements ObjectSchema<T>
{
  _type!: { [K in keyof T]: InferType<T[K]> };
  _optional = false;
  _default: unknown = undefined;
  shape: T;

  constructor(shape: T) {
    this.shape = shape;
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
    // biome-ignore lint/suspicious/noExplicitAny: ...
    const shape: any = {};
    for (const [key, schema] of Object.entries(this.shape)) {
      // biome-ignore lint/suspicious/noExplicitAny: ...
      shape[key] = (schema as any)._serialize();
    }
    return {
      type: "object",
      optional: this._optional,
      default: this._default,
      shape,
    };
  }
}
