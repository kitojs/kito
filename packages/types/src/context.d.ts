// biome-ignore assist/source/organizeImports: ...
import type { KitoRequest } from "./http/request";
import type { KitoResponse } from "./http/response";

import type { SchemaDefinition, InferSchemaRequest } from "./schema/base";

// biome-ignore lint/complexity/noBannedTypes: ...
export interface KitoContext<TSchema extends SchemaDefinition = {}> {
  req: KitoRequest & InferSchemaRequest<TSchema>;
  res: KitoResponse;
}

// biome-ignore lint/complexity/noBannedTypes: ...
export type Context<TSchema extends SchemaDefinition = {}> =
  KitoContext<TSchema>;
