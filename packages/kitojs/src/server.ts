import type { ServerConfig } from "@kitojs/types";

class Server {
	constructor(config?: ServerConfig) {}
}

export function server(config?: ServerConfig): Server {
	return new Server(config);
}
