#!/usr/bin/env tsx

import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
let style: string | undefined;
let example: string | undefined;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--style" && i + 1 < args.length) {
    style = args[i + 1];
    i++;
  } else if (args[i] === "--example" && i + 1 < args.length) {
    example = args[i + 1];
    i++;
  }
}

if (!style || !example) {
  console.error(
    "Usage: pnpm ex:run --style <fluent|instance> --example <example-name>",
  );
  console.error("\nExamples:");
  console.error("  pnpm ex:run --style fluent --example basic");
  console.error("  pnpm ex:run --style fluent --example router");
  console.error("  pnpm ex:run --style fluent --example schemas/builder");
  process.exit(1);
}

if (style !== "fluent" && style !== "instance") {
  console.error(`Invalid style: ${style}. Must be 'fluent' or 'instance'.`);
  process.exit(1);
}

let filePath: string;

const dirWithIndex = resolve(__dirname, style, example, "index.ts");
if (existsSync(dirWithIndex)) {
  filePath = dirWithIndex;
} else {
  const directFile = resolve(__dirname, style, `${example}.ts`);
  if (existsSync(directFile)) {
    filePath = directFile;
  } else {
    console.error(`Example not found: ${style}/${example}`);
    console.error(`Tried: ${dirWithIndex} and ${directFile}`);
    process.exit(1);
  }
}

console.log(`Running example: ${style}/${example}`);
import(filePath);
