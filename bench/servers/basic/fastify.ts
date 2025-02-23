import Fastify from 'fastify';

const fastify = Fastify();

fastify.get('/', function (request, reply) {
  reply.send('Hello, world!');
});

fastify.listen({ port: 3000 });
