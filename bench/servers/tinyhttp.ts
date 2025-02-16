import { App } from '@tinyhttp/app'

const app = new App()

app.get('/', (req, res) => {
	res.send('Hello, world!')
})

app.listen(3000)
