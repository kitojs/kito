import restify from 'restify';

const server = restify.createServer();

server.get('/', (req, res, next) => {
  res.send('Hello, world!');
  next();
});

server.listen(3000);
