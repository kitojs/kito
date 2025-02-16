// autocannon options:
const PORT = 3000
const URL = `http://localhost:${PORT}`
const CONNECTIONS = 100
const DURATION = 10
const METHOD = 'GET'
const PIPELINING = 10

const results = []

const servers = [
	{ name: 'kito', runner: 'deno', args: ['run', '-A'], extension: 'ts' },
	{
		name: 'fastify',
		runner: 'node',
		args: ['--no-warnings', '--experimental-strip-types'],
		extension: 'ts'
	},
	{
		name: 'hono',
		runner: 'node',
		args: ['--no-warnings', '--experimental-strip-types'],
		extension: 'ts'
	},
	{
		name: 'hapi',
		runner: 'node',
		args: ['--no-warnings', '--experimental-strip-types'],
		extension: 'ts'
	},
	{
		name: 'express',
		runner: 'node',
		args: ['--no-warnings', '--experimental-strip-types'],
		extension: 'mjs'
	},
	{
		name: 'koa',
		runner: 'node',
		args: ['--no-warnings', '--experimental-strip-types'],
		extension: 'ts'
	},
	{
		name: 'polka',
		runner: 'node',
		args: ['--no-warnings', '--experimental-strip-types'],
		extension: 'ts'
	},
	{
		name: 'rayo',
		runner: 'node',
		args: ['--no-warnings', '--experimental-strip-types'],
		extension: 'ts'
	},
	{
		name: 'restify',
		runner: 'node',
		args: ['--no-warnings', '--experimental-strip-types'],
		extension: 'ts'
	},
	{
		name: 'tinyhttp',
		runner: 'node',
		args: ['--no-warnings', '--experimental-strip-types'],
		extension: 'ts'
	}
]

export {
	PORT,
	URL,
	CONNECTIONS,
	DURATION,
	METHOD,
	PIPELINING,
	results,
	servers
}
