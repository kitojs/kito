// biome-ignore assist/source/organizeImports: ...
import { StringSchemaImpl } from "./primitives/string";
import { NumberSchemaImpl } from "./primitives/number";
import { BooleanSchemaImpl } from "./primitives/boolean";
import { ArraySchemaImpl } from "./primitives/array";
import { ObjectSchemaImpl } from "./primitives/object";
import { LiteralSchemaImpl } from "./primitives/literal";
import { UnionSchemaImpl } from "./primitives/union";

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
