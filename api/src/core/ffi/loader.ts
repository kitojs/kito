import { FFI_FUNCTIONS_LIST } from "./functions.ts";

export function getFFIPath(): string {
    let suffix = "";
    switch (Deno.build.os) {
        case "windows":
            suffix = "dll";
            break;
        case "darwin":
            suffix = "dylib";
            break;
        case "linux":
            suffix = "so";
            break;
        default:
            throw new Error("unsupported operating system");
    }

    return `target/release/kito.${suffix}`;
}

export function loadFunctions(): Deno.DynamicLibrary<Deno.ForeignLibraryInterface> {
    const path = getFFIPath();
    const lib = Deno.dlopen(path, FFI_FUNCTIONS_LIST);

    return lib;
}