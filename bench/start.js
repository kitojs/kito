import { spawn } from 'node:child_process'
import autocannon from 'autocannon'
import chalk from 'chalk'
import { createCanvas } from 'canvas'
import { Chart } from 'chart.js/auto'
import fs from 'fs'
import { program } from 'commander'

import { results, servers } from './consts.js'

// autocannon variables
let port, url, connections, duration, method, pipelining

const startServer = (name, runner, args, extension) => {
	return new Promise((resolve, reject) => {
		console.log(chalk.cyan(`\nStarting server ${name}...`))

		const server = spawn(
			runner,
			[...args, `bench/servers/${name}.${extension}`],
			{
				stdio: 'inherit'
			}
		)

		setTimeout(() => resolve(server), 2000)
	})
}

const stopServer = (server, name) => {
	return new Promise((resolve) => {
		console.log(chalk.red(`\nShutting down server ${name}...`))
		server.kill()
		setTimeout(resolve, 1000)
	})
}

const runBenchmark = ({
	name,
	url,
	connections,
	duration,
	method,
	pipelining
}) => {
	return new Promise((resolve, reject) => {
		console.log(chalk.blue(`\nBenchmarking ${name}...`))

		autocannon(
			{
				url,
				connections,
				duration,
				method,
				pipelining
			},
			(err, result) => {
				if (err) return reject(err)

				const reqPerSec = result.requests.average
				const latency = result.latency.average
				results.push({ name, reqPerSec, latency })

				console.log(
					chalk.green(
						`${name} - req/s: ${reqPerSec.toFixed(2)}, latency: ${latency.toFixed(2)} ms`
					)
				)
				resolve()
			}
		)
	})
}

const generateChart = (outputPath) => {
	const width = 800
	const height = 400
	const canvas = createCanvas(width, height)
	const ctx = canvas.getContext('2d')

	ctx.fillStyle = '#ffffff'
	ctx.fillRect(0, 0, width, height)

	const chartConfig = {
		type: 'bar',
		data: {
			labels: results.map((result) => result.name),
			datasets: [
				{
					label: 'Req/s',
					data: results.map((result) => result.reqPerSec),
					backgroundColor: 'rgba(75, 192, 192, 1)',
					borderColor: 'rgba(75, 192, 192, 1)',
					borderWidth: 1,
					yAxisID: 'reqs'
				},
				{
					label: 'Latency (ms)',
					data: results.map((result) => result.latency),
					backgroundColor: 'rgba(255, 99, 132, 1)',
					borderColor: 'rgba(255, 99, 132, 1)',
					borderWidth: 1,
					yAxisID: 'latency'
				}
			]
		},
		options: {
			responsive: false,
			maintainAspectRatio: false,
			scales: {
				reqs: {
					type: 'linear',
					position: 'left',
					ticks: {
						beginAtZero: true
					}
				},
				latency: {
					type: 'linear',
					position: 'right',
					ticks: {
						beginAtZero: true
					}
				}
			},
			plugins: {
				legend: {
					position: 'top'
				},
				title: {
					display: true,
					text: 'Benchmark Results'
				}
			}
		}
	}

	new Chart(ctx, chartConfig)

	const buffer = canvas.toBuffer('image/jpeg')
	fs.writeFileSync(outputPath, buffer)

	console.log(chalk.green(`\nChart saved to ${outputPath}`))
}

const run = async ({
	url,
	connections,
	duration,
	method,
	pipelining,
	noImage,
	imagePath
}) => {
	if (noImage) {
		console.log(
			chalk.yellow(
				'The --no-image flag is active, the chart image will not be generated.'
			)
		)
	}

	for (const { name, runner, args, extension } of servers) {
		const srv = await startServer(name, runner, args, extension)
		await runBenchmark({
			name,
			url,
			connections,
			duration,
			method,
			pipelining
		})
		await stopServer(srv, name)
	}

	console.log(chalk.yellow('\nBenchmark results:'))
	console.log(
		chalk.white(
			`Duration: ${duration}\nConnections: ${connections}\nURL: ${URL}\nMethod: ${method}\nPipelining: ${pipelining}\n`
		)
	)
	console.table(
		results.map(({ name, reqPerSec, latency }) => ({
			Server: name,
			'Req/s': reqPerSec.toFixed(2),
			Latency: `${latency.toFixed(2)} ms`
		}))
	)

	const fastest = results.reduce((max, server) =>
		server.reqPerSec > max.reqPerSec ? server : max
	)
	console.log(
		chalk.magenta(
			`\nThe fastest server was ${chalk.bold(fastest.name)} with ${chalk.bold(
				fastest.reqPerSec.toFixed(2)
			)} req/s.`
		)
	)

	const bestLatency = results.reduce((min, server) =>
		server.latency < min.latency ? server : min
	)
	console.log(
		chalk.blue(
			`The server with the best latency was ${chalk.bold(bestLatency.name)} with ${chalk.bold(
				bestLatency.latency.toFixed(2)
			)} ms.`
		)
	)

	if (!noImage) generateChart(imagePath)
}

const init = () => {
	program
		.name('kito-bench')
		.description(
			'Benchmarking Kito against other JavaScript web frameworks.'
		)

	program
		.option('-u, --url <url>', 'Server URL')
		.option('-p, --port <port>', 'Server port')
		.option('-c, --connections <connections>', 'Number of connections')
		.option(
			'-d, --duration <duration>',
			'Duration of the benchmark in seconds'
		)
		.option('-m, --method <method>', 'HTTP Method')
		.option('--pipelining <pipelining>', 'Number of pipelining requests')
		.option('--ni, --no-image', 'Disable chart image generation')
		.option('--imp, --image-path <path>', 'Path to save the image')

	program.parse(process.argv)

	const options = program.opts()

	url =
		options.url ||
		(options.port
			? `http://localhost:${options.port}`
			: 'http://localhost:3000')
	connections = options.connections ? parseInt(options.connections) : 100
	duration = options.duration ? parseInt(options.duration) : 40
	method = options.method ? options.method : 'GET'
	pipelining = options.pipelining ? parseInt(options.pipelining) : 10
	const noImage = !options.image
	const imagePath = options.imagePath
		? options.imagePath
		: './bench/charts/results.jpeg'

	run({
		url,
		connections,
		duration,
		method,
		pipelining,
		noImage,
		imagePath
	}).catch((err) => console.error(chalk.red(err)))
}

init()
