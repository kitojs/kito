import { getSuffix } from './utils.ts';

export function loadFunctions(): Deno.DynamicLibrary<Deno.ForeignLibraryInterface> {
  const path = `target/release/libkito.${getSuffix()}`;
  const lib = Deno.dlopen(path, {
    run: {
      parameters: ['pointer', 'usize'],
      result: 'void',
      nonblocking: true,
    },
    register_callback: { parameters: ['function'], result: 'void' },
  });

  return lib;
}
