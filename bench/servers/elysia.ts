import { Elysia } from 'elysia';

new Elysia().get('/', 'Hello, world!').listen(3000);
