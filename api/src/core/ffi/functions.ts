export const FFI_FUNCTIONS_LIST: Deno.ForeignLibraryInterface = {
	run: { parameters: ['pointer', 'u16'], result: 'void', nonblocking: true },
	add_routes: { parameters: ['pointer', 'usize'], result: 'void' },
	register_callback: { parameters: ['function'], result: 'void' }
}
