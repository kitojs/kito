import type { SchemaDefinition } from "@kitojs/types";

export function schema<T extends SchemaDefinition>(definition: T): T {
  return definition;
}
