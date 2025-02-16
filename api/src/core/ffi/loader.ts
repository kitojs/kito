import { FFI_FUNCTIONS_LIST } from './functions.ts';

export function getFFIPath(): string {
  let lib = '';
  switch (Deno.build.os) {
    case 'windows':
      lib = 'kito.dll';
      break;
    case 'darwin':
      lib = 'libkito.dylib';
      break;
    case 'linux':
      lib = 'libkito.so';
      break;
    default:
      throw new Error('unsupported operating system');
  }

  return `target/release/${lib}`;
}

export function loadFunctions(): Deno.DynamicLibrary<Deno.ForeignLibraryInterface> {
  const path = getFFIPath();
  const lib = Deno.dlopen(path, FFI_FUNCTIONS_LIST);

  return lib;
}
