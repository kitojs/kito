import { server } from '../api/src/core/server.ts';

const app = server();

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.post('/post', (req, res) => {
  res.send('POST route');
});

app.put('/put', (req, res) => {
  res.send('PUT route');
});

app.patch('/patch', (req, res) => {
  res.send('PATCH route');
});

app.delete('/delete', (req, res) => {
  res.send('DELETE route');
});

app.listen(3000);
