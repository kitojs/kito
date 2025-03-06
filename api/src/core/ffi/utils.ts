export function detectRuntime(): 'deno' | 'bun' | 'node' {
  if (globalThis.Deno) {
    return 'deno';
  }
  if (globalThis.Bun) {
    return 'bun';
  }

  return 'node';
}

export function getSuffix(): 'dll' | 'dylib' | 'so' {
  const platform = getOS();

  const osMapping: Record<string, 'dll' | 'dylib' | 'so'> = {
    win32: 'dll',
    windows: 'dll',

    darwin: 'dylib',
    linux: 'so',
  };

  return osMapping[platform] || 'so';
}

function getOS(): string {
  const runtime = detectRuntime();

  if (runtime === 'node' || runtime === 'bun') {
    return process.platform;
  }

  return Deno.build.os;
}
