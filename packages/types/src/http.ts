export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";

export type Request<Params = any, Query = any, Body = any> = {
	method: Method;
	url: string;
	path: string;
	params: Params;
	query: Query;
	body: Body;
	headers: Record<string, string | undefined>;
	cookies: Record<string, string>;
	ip?: string;
};

export type Response = {
	status: (code: number) => Response;
	header: (name: string, value: string) => Response;
	cookie: (
		name: string,
		value: string,
		options?: {
			httpOnly?: boolean;
			secure?: boolean;
			sameSite?: "strict" | "lax" | "none";
			maxAge?: number;
			path?: string;
		},
	) => Response;
	clearCookie: (name: string) => Response;
	send: (body: unknown) => void;
	json: (data: any) => void;
	text: (data: string) => void;
	redirect: (url: string, status?: number) => void;
};
