type LoggerLevels = "error" | "warn" | "info" | "debug";
type CompilerTargets = "rust" | "go";

type Config = {
  server: {
    port: number;
    host: string;
    strict?: boolean;
  };
  compiler: {
    target: CompilerTargets;
    options?: {
      minify?: boolean;
    };
  };
  logger?: {
    levels: LoggerLevels[];
  };
};

export default Config;
