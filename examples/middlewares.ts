import { server } from '../api/src/core/server.ts';

const app = server();

app.use((req, res, next) => {
  res.header('X-Powered-By', 'Kito');
  next();
});

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader === 'Bearer secret_token') {
    return next();
  }

  res.status(401).send('Unauthorized');
};

app.get('/public', (req, res) => {
  res.send('public ok');
});

app.get('/private', authMiddleware, (req, res) => {
  res.send('private ok');
});

app.listen(3000);
