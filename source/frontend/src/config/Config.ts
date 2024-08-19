import { existsSync, writeFileSync } from "node:fs";

const PROYECT_ROOT_PATH = process.cwd();
const CONFIG_PATH = `${PROYECT_ROOT_PATH}/${CONFIG_FILENAME}`;

export function existsConfigFile() {
  return existsSync(CONFIG_PATH);
}

export function createConfigFile() {
  writeFileSync(CONFIG_PATH, DEFAULT_CONFIG);
}
