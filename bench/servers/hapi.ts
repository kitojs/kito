import { server } from '@hapi/hapi'

const app = server({
	port: 3000,
	host: 'localhost'
})

app.route({
	method: 'GET',
	path: '/',
	handler: (request, h) => {
		return 'Hello, world!'
	}
})

await app.start()
