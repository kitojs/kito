export const FFI_FUNCTIONS_LIST: Deno.ForeignLibraryInterface = {
  run: { parameters: ["pointer", "u16"], result: "void" },
  add_routes: { parameters: ["pointer", "usize"], result: "void" },
};
