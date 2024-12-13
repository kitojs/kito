import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

export default defineConfig({
	integrations: [
		starlight({
			title: 'Kito',
			description: 'A web framework written in Rust for TypeScript',
			author: 'Nehuén <https://github.com/nehu3n>',
			favicon: '/favicon.png',
			social: {
				github: 'https://github.com/nehu3n/kito'
			}
		})
	]
})
