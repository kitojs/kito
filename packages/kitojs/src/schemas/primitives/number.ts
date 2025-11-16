import type { NumberSchema } from "@kitojs/types";

export class NumberSchemaImpl implements NumberSchema {
  _type!: number;
  _optional = false;
  _default: unknown = undefined;
  // biome-ignore lint/suspicious/noExplicitAny: ...
  private constraints: any[] = [];

  min(value: number): NumberSchema {
    this.constraints.push({ type: "min", value });
    return this;
  }

  max(value: number): NumberSchema {
    this.constraints.push({ type: "max", value });
    return this;
  }

  int(): NumberSchema {
    this.constraints.push({ type: "int" });
    return this;
  }

  positive(): NumberSchema {
    this.constraints.push({ type: "positive" });
    return this;
  }

  negative(): NumberSchema {
    this.constraints.push({ type: "negative" });
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
  default(value: number): any {
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
      type: "number",
      optional: this._optional,
      default: this._default,
      constraints: this.constraints,
    };
  }
}
