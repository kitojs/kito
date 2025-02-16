import rayo from 'rayo'

rayo({ port: 3000 })
	.get('/hello/:user', (req, res) => res.end('Hello, world!'))
	.start()
