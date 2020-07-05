import supertest from 'supertest';
import { ALL } from '../../src/http/methods';
import { responseTime } from '../../src/http/middlewares';
import runHTTP from '../../src/http';

describe('response-time middleware', () => {
  ALL('/response-time', [responseTime], () => 'Hello World');

  test('should respond with X-Response-Time header', async () => {
    const response = await supertest(runHTTP())
      .get('/response-time');

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(response.body).toBe('Hello World');
    expect(response.get('X-Response-Time')).toBeTruthy();
  });
});
