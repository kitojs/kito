import { server } from '../src/core/server.ts';

const app = server();

app.get('/users/:id', (req, res) => {
  res.json({ userId: req.params.id });
});

app.listen(3000);
