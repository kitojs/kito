declare const CONFIG_FILENAME = "kito.config.ts";

declare const DEFAULT_CONFIG = `
import type Config from "@kito/core";

const config: Config = {
  server: {
    port: 3000,
    host: "localhost",
  },
  compiler: {
    target: "go",
  },
  logger: {
    levels: ["error", "info", "warn"],
  },
};

export default config;
`;
