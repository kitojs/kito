type StringFormat = "email" | "uuid" | "uri" | "date-time";

interface BaseJSONSchema {
    description?: string;
    default?: unknown;
}

export interface JSONSchemaString extends BaseJSONSchema {
    type: "string";
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    format?: StringFormat;
    enum?: readonly string[];
    const?: string;
}

export interface JSONSchemaNumber extends BaseJSONSchema {
    type: "number" | "integer";
    minimum?: number;
    maximum?: number;
    enum?: readonly number[];
    const?: number;
}

export interface JSONSchemaBoolean extends BaseJSONSchema {
    type: "boolean";
    const?: boolean;
}

export interface JSONSchemaArray extends BaseJSONSchema {
    type: "array";
    items: JSONSchema;
    minItems?: number;
    maxItems?: number;
}

export interface JSONSchemaObject extends BaseJSONSchema {
    type: "object";
    properties: Record<string, JSONSchema>;
    required?: readonly string[];
}

export type JSONSchema =
    | JSONSchemaString
    | JSONSchemaNumber
    | JSONSchemaBoolean
    | JSONSchemaArray
    | JSONSchemaObject;

type InferString<T extends JSONSchemaString> = T extends { const: infer C }
    ? C
    : T extends { enum: infer E }
    ? E extends readonly (infer U)[]
    ? U
    : never
    : string;

type InferNumber<T extends JSONSchemaNumber> = T extends { const: infer C }
    ? C
    : T extends { enum: infer E }
    ? E extends readonly (infer U)[]
    ? U
    : never
    : number;

type InferBoolean<T extends JSONSchemaBoolean> = T extends { const: infer C }
    ? C
    : boolean;

type InferArray<T extends JSONSchemaArray> = T extends { items: infer I }
    ? I extends JSONSchema
    ? InferJSONSchemaType<I>[]
    : never
    : never;

type InferObject<T extends JSONSchemaObject> = T extends {
    properties: infer P;
    required?: infer R;
}
    ? P extends Record<string, JSONSchema>
    ? R extends readonly string[]
    ? {
        [K in keyof P as K extends R[number]
        ? K
        : never]: P[K] extends JSONSchema
        ? InferJSONSchemaType<P[K]>
        : never;
    } & {
        [K in keyof P as K extends R[number]
        ? never
        : K]?: P[K] extends JSONSchema ? InferJSONSchemaType<P[K]> : never;
    }
    : {
        [K in keyof P]?: P[K] extends JSONSchema
        ? InferJSONSchemaType<P[K]>
        : never;
    }
    : never
    : never;

export type InferJSONSchemaType<T> = T extends { default: infer D }
    ? D
    : T extends JSONSchemaString
    ? InferString<T>
    : T extends JSONSchemaNumber
    ? InferNumber<T>
    : T extends JSONSchemaBoolean
    ? InferBoolean<T>
    : T extends JSONSchemaArray
    ? InferArray<T>
    : T extends JSONSchemaObject
    ? InferObject<T>
    : never;

export interface JSONSchemaDefinition {
    params?: JSONSchemaObject;
    query?: JSONSchemaObject;
    body?: JSONSchema;
    headers?: JSONSchemaObject;
    response?: {
        [statusCode: number]: JSONSchema;
    };
}

export type InferJSONSchemaRequest<T extends JSONSchemaDefinition> = {
    params: T["params"] extends JSONSchemaObject
    ? InferJSONSchemaType<T["params"]>
    : Record<string, string>;
    query: T["query"] extends JSONSchemaObject
    ? InferJSONSchemaType<T["query"]>
    : Record<string, string | string[]>;
    body: T["body"] extends JSONSchema ? InferJSONSchemaType<T["body"]> : unknown;
    headers: T["headers"] extends JSONSchemaObject
    ? InferJSONSchemaType<T["headers"]>
    : Record<string, string | string[]>;
};
