export const FFI_FUNCTIONS_LIST: Deno.ForeignLibraryInterface = {
    run: { parameters: ["pointer", "u16"], result: "void" }
};