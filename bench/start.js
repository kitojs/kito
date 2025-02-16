import { spawn } from 'node:child_process'
import autocannon from 'autocannon'
import chalk from 'chalk'

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
		chalk.green(
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
			`\nThe server with the best latency was ${chalk.bold(bestLatency.name)} with ${chalk.bold(
				bestLatency.latency.toFixed(2)
			)} ms.`
		)
	)
}

run().catch((err) => console.error(chalk.red(err)))
