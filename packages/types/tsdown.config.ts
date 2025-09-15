import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/index.d.ts",
  outDir: "dist",

  format: "esm",
  minify: true,

  dts: true,
  tsconfig: "tsconfig.json",
});
