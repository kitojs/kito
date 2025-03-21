import { server } from '../../../packages/server/src/core/server.ts';

const app = server();

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.listen(3000);
