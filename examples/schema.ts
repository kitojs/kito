import { server, route, t } from '../api/src/core/server.ts';

const app = server();

app.get(
  route('/users/one/:id')
    .params({ id: t.string() })
    .response(t.object({ userId: t.string() })),
  (req, res) => {
    res.json({ userId: req.params.id }); // ok

    /*
    res.json({ userId: 123 }); // error: type 'number' is not assignable to type 'string'
    res.json({ otherField: 'hello' }); // error: object literal may only specify known properties
    */
  },
);

app.get(
  route('/users/two/:id')
    .params({
      id: t.string({
        minLength: 3,
        maxLength: 10,
        pattern: '^[a-zA-Z0-9]+$',
      }),
    })
    .response(
      t.object({
        userId: t.string(),
        email: t.string({ email: true }),
        scores: t.array(t.number({ min: 0, max: 100 }), {
          minItems: 1,
          maxItems: 5,
        }),
      }),
    ),
  (req, res) => {
    res.json({
      userId: req.params.id,
      email: 'user@example.com',
      scores: [85, 92, 78],
    });
  },
);

app.post(
  route('/register')
    .params({
      email: t.string({ email: true }),
      password: t.string({ minLength: 8 }),
    })
    .response(
      t.object({
        success: t.boolean(),
        message: t.string(),
      }),
    ),
  (req, res) => {
    res.json({
      success: true,
      message: 'registration successful',
    });
  },
);

app.listen(3000);
