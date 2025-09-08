import type { RouteContext } from "./ctx";

export type SchemaBuilder<T> = { _output: T };

export declare const t: {
	str: () => SchemaBuilder<string> & {
		min: (n: number) => SchemaBuilder<string>;
		max: (n: number) => SchemaBuilder<string>;
		regex: (r: RegExp) => SchemaBuilder<string>;
		uuid: () => SchemaBuilder<string>;
		email: () => SchemaBuilder<string>;
		url: () => SchemaBuilder<string>;
		default: (v: string) => SchemaBuilder<string>;
	};

	num: () => SchemaBuilder<number> & {
		min: (n: number) => SchemaBuilder<number>;
		max: (n: number) => SchemaBuilder<number>;
		int: () => SchemaBuilder<number>;
		positive: () => SchemaBuilder<number>;
		negative: () => SchemaBuilder<number>;
		default: (v: number) => SchemaBuilder<number>;
	};

	bool: () => SchemaBuilder<boolean> & {
		default: (v: boolean) => SchemaBuilder<boolean>;
	};

	array: <T>(item: SchemaBuilder<T>) => SchemaBuilder<T[]> & {
		min: (n: number) => SchemaBuilder<T[]>;
		max: (n: number) => SchemaBuilder<T[]>;
	};

	object: <T extends Record<string, SchemaBuilder<any>>>(
		shape: T,
	) => SchemaBuilder<{
		[K in keyof T]: T[K] extends SchemaBuilder<infer O> ? O : never;
	}>;

	union: <T extends SchemaBuilder<any>[]>(
		alts: T,
	) => SchemaBuilder<T[number] extends SchemaBuilder<infer O> ? O : never>;

	literal: <T extends string | number | boolean>(v: T) => SchemaBuilder<T>;

	optional: <T>(s: SchemaBuilder<T>) => SchemaBuilder<T | undefined>;
};

type ExtractType<T> = T extends { _output: infer O } ? O : never;

export function schema<
	P extends SchemaBuilder<any> | undefined,
	Q extends SchemaBuilder<any> | undefined,
	B extends SchemaBuilder<any> | undefined,
>(cfg: {
	params?: P;
	query?: Q;
	body?: B;
}): {
	__kitoSchema: typeof cfg;
	__ctx: RouteContext<
		P extends SchemaBuilder<any> ? ExtractType<P> : {},
		Q extends SchemaBuilder<any> ? ExtractType<Q> : {},
		B extends SchemaBuilder<any> ? ExtractType<B> : {}
	>;
};
