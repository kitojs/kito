export const FFI_FUNCTIONS_LIST: Deno.ForeignLibraryInterface = {
  run: {
    parameters: ['pointer', 'u16', 'pointer', 'usize'],
    result: 'void',
    nonblocking: true,
  },
  register_callback: { parameters: ['function'], result: 'void' },
};
