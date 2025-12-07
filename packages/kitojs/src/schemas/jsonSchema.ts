// biome-ignore assist/source/organizeImports: ...
import type {
  SchemaType,
  JSONSchema,
  JSONSchemaString,
  JSONSchemaNumber,
  JSONSchemaBoolean,
  JSONSchemaArray,
  JSONSchemaObject,
} from "@kitojs/types";

import { t } from "./builders";

export function convertJSONSchema(schema: JSONSchema): SchemaType {
  switch (schema.type) {
    case "string":
      return convertStringSchema(schema as JSONSchemaString);
    case "number":
    case "integer":
      return convertNumberSchema(schema as JSONSchemaNumber);
    case "boolean":
      return convertBooleanSchema(schema as JSONSchemaBoolean);
    case "array":
      return convertArraySchema(schema as JSONSchemaArray);
    case "object":
      return convertObjectSchema(schema as JSONSchemaObject);
    default:
      // biome-ignore lint/suspicious/noExplicitAny: ...
      throw new Error(`Unsupported JSON Schema type: ${(schema as any).type}`);
  }
}

function convertStringSchema(schema: JSONSchemaString): SchemaType {
  if (schema.const !== undefined) {
    let schemaBuilder = t.literal(schema.const);
    if (schema.default !== undefined) {
      // biome-ignore lint/suspicious/noExplicitAny: ...
      schemaBuilder = schemaBuilder.default(schema.default as string) as any;
    }
    return schemaBuilder as SchemaType;
  }

  if (schema.enum && schema.enum.length > 0) {
    const literals = schema.enum.map((value) => t.literal(value));
    let schemaBuilder = t.union(...literals);
    if (schema.default !== undefined) {
      schemaBuilder = schemaBuilder.default(
        schema.default as (typeof schema.enum)[number],
        // biome-ignore lint/suspicious/noExplicitAny: ...
      ) as any;
    }
    return schemaBuilder as SchemaType;
  }

  let schemaBuilder = t.str();

  if (schema.minLength !== undefined) {
    schemaBuilder = schemaBuilder.min(schema.minLength);
  }
  if (schema.maxLength !== undefined) {
    schemaBuilder = schemaBuilder.max(schema.maxLength);
  }

  if (schema.format) {
    switch (schema.format) {
      case "email":
        schemaBuilder = schemaBuilder.email();
        break;
      case "uuid":
        schemaBuilder = schemaBuilder.uuid();
        break;
      case "uri":
        schemaBuilder = schemaBuilder.url();
        break;
    }
  }

  if (schema.pattern) {
    schemaBuilder = schemaBuilder.regex(new RegExp(schema.pattern));
  }

  if (schema.default !== undefined) {
    // biome-ignore lint/suspicious/noExplicitAny: ...
    schemaBuilder = schemaBuilder.default(schema.default as string) as any;
  }

  return schemaBuilder as SchemaType;
}

function convertNumberSchema(schema: JSONSchemaNumber): SchemaType {
  if (schema.const !== undefined) {
    let schemaBuilder = t.literal(schema.const);
    if (schema.default !== undefined) {
      // biome-ignore lint/suspicious/noExplicitAny: ...
      schemaBuilder = schemaBuilder.default(schema.default as number) as any;
    }
    return schemaBuilder as SchemaType;
  }

  if (schema.enum && schema.enum.length > 0) {
    const literals = schema.enum.map((value) => t.literal(value));
    let schemaBuilder = t.union(...literals);
    if (schema.default !== undefined) {
      schemaBuilder = schemaBuilder.default(
        schema.default as (typeof schema.enum)[number],
        // biome-ignore lint/suspicious/noExplicitAny: ...
      ) as any;
    }
    return schemaBuilder as SchemaType;
  }

  let schemaBuilder = t.num();

  if (schema.type === "integer") {
    schemaBuilder = schemaBuilder.int();
  }

  if (schema.minimum !== undefined) {
    schemaBuilder = schemaBuilder.min(schema.minimum);
  }
  if (schema.maximum !== undefined) {
    schemaBuilder = schemaBuilder.max(schema.maximum);
  }

  if (schema.default !== undefined) {
    // biome-ignore lint/suspicious/noExplicitAny: ...
    schemaBuilder = schemaBuilder.default(schema.default as number) as any;
  }

  return schemaBuilder as SchemaType;
}

function convertBooleanSchema(schema: JSONSchemaBoolean): SchemaType {
  if (schema.const !== undefined) {
    let schemaBuilder = t.literal(schema.const);
    if (schema.default !== undefined) {
      // biome-ignore lint/suspicious/noExplicitAny: ...
      schemaBuilder = schemaBuilder.default(schema.default as boolean) as any;
    }
    return schemaBuilder as SchemaType;
  }

  let schemaBuilder = t.bool();

  if (schema.default !== undefined) {
    // biome-ignore lint/suspicious/noExplicitAny: ...
    schemaBuilder = schemaBuilder.default(schema.default as boolean) as any;
  }

  return schemaBuilder as SchemaType;
}

function convertArraySchema(schema: JSONSchemaArray): SchemaType {
  const itemSchema = convertJSONSchema(schema.items);

  let schemaBuilder = t.array(itemSchema);

  if (schema.minItems !== undefined) {
    schemaBuilder = schemaBuilder.min(schema.minItems);
  }
  if (schema.maxItems !== undefined) {
    schemaBuilder = schemaBuilder.max(schema.maxItems);
  }

  if (schema.default !== undefined) {
    // biome-ignore lint/suspicious/noExplicitAny: ...
    schemaBuilder = schemaBuilder.default(schema.default as any[]) as any;
  }

  return schemaBuilder as SchemaType;
}

function convertObjectSchema(schema: JSONSchemaObject): SchemaType {
  const shape: Record<string, SchemaType> = {};
  const requiredFields = new Set(schema.required || []);

  for (const [key, propSchema] of Object.entries(schema.properties)) {
    let convertedSchema = convertJSONSchema(propSchema);

    if (!requiredFields.has(key)) {
      // biome-ignore lint/suspicious/noExplicitAny: ...
      convertedSchema = (convertedSchema as any).optional();
    }

    shape[key] = convertedSchema;
  }

  let schemaBuilder = t.object(shape);

  if (schema.default !== undefined && schema.default !== null) {
    // biome-ignore lint/suspicious/noExplicitAny: ...
    schemaBuilder = schemaBuilder.default(schema.default as any) as any;
  }

  return schemaBuilder as SchemaType;
}
