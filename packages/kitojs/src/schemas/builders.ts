// biome-ignore assist/source/organizeImports: ...
import { StringSchemaImpl } from "./string";
import { NumberSchemaImpl } from "./number";
import { BooleanSchemaImpl } from "./boolean";
import { ArraySchemaImpl } from "./array";
import { ObjectSchemaImpl } from "./object";
import { LiteralSchemaImpl } from "./literal";
import { UnionSchemaImpl } from "./union";

import type {
  StringSchema,
  NumberSchema,
  BooleanSchema,
  ArraySchema,
  ObjectSchema,
  LiteralSchema,
  UnionSchema,
  SchemaType,
} from "@kitojs/types";

export const t = {
  str(): StringSchema {
    return new StringSchemaImpl();
  },
  num(): NumberSchema {
    return new NumberSchemaImpl();
  },
  bool(): BooleanSchema {
    return new BooleanSchemaImpl();
  },
  array<T extends SchemaType>(item: T): ArraySchema<T> {
    return new ArraySchemaImpl(item);
  },
  object<T extends Record<string, SchemaType>>(shape: T): ObjectSchema<T> {
    return new ObjectSchemaImpl(shape);
  },
  literal<T extends string | number | boolean>(value: T): LiteralSchema<T> {
    return new LiteralSchemaImpl(value);
  },
  union<T extends SchemaType[]>(...schemas: T): UnionSchema<T> {
    return new UnionSchemaImpl(schemas);
  },
};
