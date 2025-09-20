import type { StringSchema } from "@kitojs/types";

export class StringSchemaImpl implements StringSchema {
  _type!: string;
  _optional = false;
  _default: unknown = undefined;
  // biome-ignore lint/suspicious/noExplicitAny: ...
  private constraints: any[] = [];

  min(length: number): StringSchema {
    this.constraints.push({ type: "min", value: length });
    return this;
  }

  max(length: number): StringSchema {
    this.constraints.push({ type: "max", value: length });
    return this;
  }

  length(length: number): StringSchema {
    this.constraints.push({ type: "length", value: length });
    return this;
  }

  email(): StringSchema {
    this.constraints.push({ type: "email" });
    return this;
  }

  url(): StringSchema {
    this.constraints.push({ type: "url" });
    return this;
  }

  uuid(): StringSchema {
    this.constraints.push({ type: "uuid" });
    return this;
  }

  regex(pattern: RegExp): StringSchema {
    this.constraints.push({ type: "regex", value: pattern });
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
  default(value: string): any {
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
      type: "string",
      optional: this._optional,
      default: this._default,
      constraints: this.constraints,
    };
  }
}
