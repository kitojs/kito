import { spawn } from 'node:child_process'
import autocannon from 'autocannon'
import chalk from 'chalk'
import { createCanvas } from 'canvas'
import { Chart } from 'chart.js/auto'
import fs from 'fs'

import {
	URL,
	CONNECTIONS,
	DURATION,
	METHOD,
	PIPELINING,
	results,
	servers
} from './consts.js'

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

const runBenchmark = (name) => {
	return new Promise((resolve, reject) => {
		console.log(chalk.blue(`\nBenchmarking ${name}...`))

		autocannon(
			{
				url: URL,
				connections: CONNECTIONS,
				duration: DURATION,
				method: METHOD,
				pipelining: PIPELINING
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

const generateChart = () => {
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
	const outputPath = './bench/charts/results.jpeg'
	fs.writeFileSync(outputPath, buffer)

	console.log(chalk.green(`\nChart saved to ${outputPath}`))
}

const run = async () => {
	for (const { name, runner, args, extension } of servers) {
		const srv = await startServer(name, runner, args, extension)
		await runBenchmark(name)
		await stopServer(srv, name)
	}

	console.log(chalk.yellow('\nBenchmark results:'))
	console.log(
		chalk.white(
			`Duration: ${DURATION}\nConnections: ${CONNECTIONS}\nURL: ${URL}\nMethod: ${METHOD}\nPipelining: ${PIPELINING}\n`
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

	generateChart()
}

run().catch((err) => console.error(chalk.red(err)))
