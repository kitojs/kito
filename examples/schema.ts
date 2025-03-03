import { server, route, t } from '../api/src/core/server.ts';

const app = server();

app.get(
  route('/users/:id')
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

app.listen(3000);
