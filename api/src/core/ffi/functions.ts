export const FFI_FUNCTIONS_LIST: Deno.ForeignLibraryInterface = {
  run: { parameters: ["pointer", "u16"], result: "void" },
  add_route: { parameters: ["pointer", "pointer", "u8"], result: "void" },
};
