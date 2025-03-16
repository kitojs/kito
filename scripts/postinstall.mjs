import { platform, arch } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFile, unlink } from 'node:fs/promises';

const BASE_URL = 'https://github.com/kitojs/kito/releases/latest/download/';
const __dirname = dirname(fileURLToPath(import.meta.url));

function getLibraryExtension() {
  switch (platform()) {
    case 'win32':
      return '.dll';
    case 'darwin':
      return '.dylib';
    default:
      return '.so';
  }
}

function getPlatformBinary() {
  const p = platform();
  const a = arch();

  if (p === 'darwin' && a === 'x64') return 'libkito-macos-x64.dylib';
  if (p === 'darwin' && a === 'arm64') return 'libkito-macos-arm64.dylib';
  if (p === 'linux' && a === 'x64') return 'libkito-linux-x64.so';
  if (p === 'linux' && a === 'arm64') return 'libkito-linux-arm64.so';
  if (p === 'win32' && a === 'x64') return 'libkito-windows-x64.dll';

  console.error(`Unsupported platform: ${p} (${a})`);
  process.exit(1);
}

async function downloadBinary(url, dest) {
  try {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Failed to download binary: ${response.status}`);

    const buffer = await response.arrayBuffer();
    await writeFile(dest, Buffer.from(buffer));

    console.log('Kito installed successfully.');
  } catch (err) {
    await unlink(dest).catch(() => {});
    console.error('Error installing Kito:', err);
    process.exit(1);
  }
}

(async () => {
  const binName = getPlatformBinary();
  const url = `${BASE_URL}${binName}`;
  const libPath = join(__dirname, `libkito${getLibraryExtension()}`);

  console.log(`Downloading Kito from ${url}...`);
  await downloadBinary(url, libPath);
})();
