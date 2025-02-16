import { kito } from '../../api/src/core/server.ts';

const app = kito();

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.listen(3000);
