// biome-ignore assist/source/organizeImports: ...
import type { KitoRequest } from "./http/request";
import type { KitoResponse } from "./http/response";

import type { SchemaDefinition, InferSchemaRequest } from "./schema/base";

export interface KitoContext<TSchema = unknown> {
  req: KitoRequest &
    // biome-ignore lint/complexity/noBannedTypes: ...
    (TSchema extends SchemaDefinition ? InferSchemaRequest<TSchema> : {});
  res: KitoResponse;
}

export type Context<TSchema = unknown> = KitoContext<TSchema>;
