import { kito } from '../api/src/core/server.ts';

const app = kito();

app.get('/users/:id', (req, res) => {
  res.json({ userId: req.params.id });
});

app.listen(3000);
