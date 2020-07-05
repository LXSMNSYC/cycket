import supertest from 'supertest';
import { ALL } from '../../src/http/methods';
import runHTTP from '../../src/http';
import { setErrorHandler } from '../../src/http/config';

describe('error middleware', () => {
  it('should respond with 500 if listener throws an error', async () => {
    ALL('/listener-error-500', [], () => {
      throw new Error('Throw an error');
    });

    const response = await supertest(runHTTP())
      .get('/listener-error-500');

    expect(response.status).toBe(500);
  });
  it('should respond with 500 if middleware throws an error', async () => {
    ALL(
      '/middleware-error-500',
      [
        () => {
          throw new Error('Throw an error');
        },
      ],
      () => 'Hello World',
    );

    const response = await supertest(runHTTP())
      .get('/middleware-error-500');

    expect(response.status).toBe(500);
  });
  it('should respond with XXX if status code has a corresponding handler', async () => {
    ALL(
      '/custom-error-401',
      [],
      (ctx) => {
        ctx.response.statusCode = 401;
        return null;
      },
    );

    setErrorHandler(401, () => 'Unauthorized');

    const response = await supertest(runHTTP())
      .get('/custom-error-401');

    expect(response.status).toBe(401);
    expect(response.text).toBe('Unauthorized');
  });
});
