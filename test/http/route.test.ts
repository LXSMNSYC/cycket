import supertest from 'supertest';
import { GET, ALL } from '../../src/http/methods';
import runHTTP from '../../src/http';
import PathSyntaxError from '../../src/errors/path-syntax';
import ListenerAlreadyExistsError from '../../src/errors/listener-already-exists';
import RouteSpecificityError from '../../src/errors/route-specificity';

describe('route', () => {
  describe('route definition', () => {
    test('should throw an PathSyntaxError when route does not begin with /', () => {
      expect(() => ALL('throw-path-syntax', [], () => 'test'))
        .toThrowError(PathSyntaxError);
    });
    test('should throw a ListenerAlreadyExists when route has already been defined.', () => {
      ALL('/listener-exists', [], () => 'test');
      expect(() => ALL('/listener-exists', [], () => 'test'))
        .toThrowError(ListenerAlreadyExistsError);
    });
    test('should throw a RouteSpecificityError when a more specific route already been defined.', () => {
      ALL('/route-specificity/throw', [], () => 'test');
      expect(() => ALL('/route-specificity/:test', [], () => 'test'))
        .toThrowError(RouteSpecificityError);
    });
    test('should respond with 200 when listener returns a JSON value', async () => {
      GET('/respond-200-json', [], () => 'Hello World');

      const response = await supertest(runHTTP()).get('/respond-200-json');

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.body).toBe('Hello World');
    });
  });
  describe('normal route', () => {
    test('should respond with 200', async () => {
      GET('/respond-200', [], (ctx) => {
        ctx.response.setHeader('Content-Type', 'application/json');
        ctx.response.end('"Hello World"');

        return null;
      });

      const response = await supertest(runHTTP()).get('/respond-200');

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.body).toBe('Hello World');
    });
    test('should respond with 404', async () => {
      const response = await supertest(runHTTP()).get('/respond-404');

      expect(response.notFound).toBe(true);
      expect(response.status).toBe(404);
    });
  });
});
