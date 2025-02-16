const results = [];

const servers = [
  { name: 'kito', runner: 'deno', args: ['run', '-A'], extension: 'ts' },
  {
    name: 'fastify',
    runner: 'node',
    args: ['--no-warnings', '--experimental-strip-types'],
    extension: 'ts',
  },
  {
    name: 'hono',
    runner: 'node',
    args: ['--no-warnings', '--experimental-strip-types'],
    extension: 'ts',
  },
  {
    name: 'hapi',
    runner: 'node',
    args: ['--no-warnings', '--experimental-strip-types'],
    extension: 'ts',
  },
  {
    name: 'express',
    runner: 'node',
    args: ['--no-warnings', '--experimental-strip-types'],
    extension: 'mjs',
  },
  {
    name: 'koa',
    runner: 'node',
    args: ['--no-warnings', '--experimental-strip-types'],
    extension: 'ts',
  },
  {
    name: 'polka',
    runner: 'node',
    args: ['--no-warnings', '--experimental-strip-types'],
    extension: 'ts',
  },
  {
    name: 'rayo',
    runner: 'node',
    args: ['--no-warnings', '--experimental-strip-types'],
    extension: 'ts',
  },
  {
    name: 'restify',
    runner: 'node',
    args: ['--no-warnings', '--experimental-strip-types'],
    extension: 'ts',
  },
  {
    name: 'tinyhttp',
    runner: 'node',
    args: ['--no-warnings', '--experimental-strip-types'],
    extension: 'ts',
  },
];

export { results, servers };
