import supertest from 'supertest';
import { cors } from '../../src/http/middlewares';
import runHTTP from '../../src/http';
import { ALL } from '../../src/http/methods';

const origin = 'https://lxsmnsyc.now.sh';

describe('cors.test.js', () => {
  describe('default options', () => {
    ALL('/cors-01/', [cors()], () => 'Hello World');

    test('should not set `Access-Control-Allow-Origin` when request Origin header missing', async () => {
      const response = await supertest(runHTTP()).get('/cors-01/');

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.body).toBe('Hello World');
      expect(response.get('Access-Control-Allow-Origin')).toBeFalsy();
    });

    test('should set `Access-Control-Allow-Origin` to request origin header', async () => {
      const response = await supertest(runHTTP())
        .get('/cors-01/')
        .set('Origin', origin);

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.body).toBe('Hello World');
      expect(response.get('Access-Control-Allow-Origin')).toBe(origin);
    });

    test('should 204 on Preflight Request', async () => {
      const response = await supertest(runHTTP())
        .options('/cors-01/')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'PUT');

      expect(response.status).toBe(204);
      expect(response.get('Access-Control-Allow-Origin')).toBe(origin);
      expect(response.get('Access-Control-Allow-Methods')).toBe('GET,HEAD,PUT,POST,DELETE,PATCH');
    });

    test('should not Preflight Request if request missing Access-Control-Request-Method', async () => {
      const response = await supertest(runHTTP())
        .options('/cors-01/')
        .set('Origin', origin);

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
    });

    test('should always set `Vary` to Origin', async () => {
      const response = await supertest(runHTTP())
        .get('/cors-01/')
        .set('Origin', origin);

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.get('Vary')).toBe('Origin');
      expect(response.body).toBe('Hello World');
    });
  });

  describe('options.origin=*', () => {
    ALL(
      '/cors-02/',
      [
        cors({
          origin: '*',
        }),
      ],
      () => 'Hello World',
    );

    test('should always set `Access-Control-Allow-Origin` to *', async () => {
      const response = await supertest(runHTTP())
        .get('/cors-02')
        .set('Origin', origin);

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.body).toBe('Hello World');
    });
  });

  describe('options.origin=function', () => {
    ALL(
      '/cors-03/*all',
      [
        cors({
          origin(ctx) {
            return (ctx.path === '/cors-03/forbidden' ? undefined : '*');
          },
        }),
      ],
      () => 'Hello World',
    );

    test('should disable cors', async () => {
      const response = await supertest(runHTTP())
        .get('/cors-03/forbidden')
        .set('Origin', origin);

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.body).toBe('Hello World');
      expect(response.get('Access-Control-Allow-Origin')).toBeFalsy();
    });

    test('should set access-control-allow-origin to *', async () => {
      const response = await supertest(runHTTP())
        .get('/cors-03/')
        .set('Origin', origin);

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.body).toBe('Hello World');
      expect(response.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('options.origin=async function', () => {
    ALL(
      '/cors-04/*all',
      [
        cors({
          origin(ctx) {
            return ctx.path === '/cors-04/forbidden' ? undefined : '*';
          },
        }),
      ],
      () => 'Hello World',
    );

    test('should disable cors', async () => {
      const response = await supertest(runHTTP())
        .get('/cors-04/forbidden')
        .set('Origin', origin);

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.body).toBe('Hello World');
      expect(response.get('Access-Control-Allow-Origin')).toBeFalsy();
    });

    test('should set access-control-allow-origin to *', async () => {
      const response = await supertest(runHTTP())
        .get('/cors-04/')
        .set('Origin', origin);

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.body).toBe('Hello World');
      expect(response.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('options.exposeHeaders', () => {
    test('should Access-Control-Expose-Headers: `content-length`', async () => {
      ALL(
        '/cors-05/',
        [
          cors({
            exposeHeaders: 'content-length',
          }),
        ],
        () => 'Hello World',
      );

      const response = await supertest(runHTTP())
        .get('/cors-05/')
        .set('Origin', origin);

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.body).toBe('Hello World');
      expect(response.get('Access-Control-Expose-Headers')).toBe('content-length');
    });

    test('should work with array', async () => {
      ALL(
        '/cors-06/',
        [
          cors({
            exposeHeaders: ['content-length', 'x-header'],
          }),
        ],
        () => 'Hello World',
      );

      const response = await supertest(runHTTP())
        .get('/cors-06/')
        .set('Origin', origin);

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.body).toBe('Hello World');
      expect(response.get('Access-Control-Expose-Headers')).toBe('content-length, x-header');
    });
  });

  describe('options.maxAge', () => {
    test('should set maxAge with number', async () => {
      ALL(
        '/cors-07/',
        [
          cors({
            maxAge: 3600,
          }),
        ],
        () => 'Hello World',
      );

      const response = await supertest(runHTTP())
        .options('/cors-07/')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'PUT');

      expect(response.status).toBe(204);
      expect(response.get('Access-Control-Max-Age')).toBe('3600');
    });

    test('should set maxAge with string', async () => {
      ALL(
        '/cors-08/',
        [
          cors({
            maxAge: '3600',
          }),
        ],
        () => 'Hello World',
      );

      const response = await supertest(runHTTP())
        .options('/cors-08/')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'PUT');

      expect(response.status).toBe(204);
      expect(response.get('Access-Control-Max-Age')).toBe('3600');
    });

    test('should not set maxAge on simple request', async () => {
      ALL(
        '/cors-09/',
        [
          cors({
            maxAge: '3600',
          }),
        ],
        () => 'Hello World',
      );

      const response = await supertest(runHTTP())
        .get('/cors-09/')
        .set('Origin', origin);

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.body).toBe('Hello World');
      expect(response.get('Access-Control-Max-Age')).toBeFalsy();
    });
  });

  describe('options.credentials', () => {
    ALL(
      '/cors-10/',
      [
        cors({
          credentials: true,
        }),
      ],
      () => 'Hello World',
    );

    test('should enable Access-Control-Allow-Credentials on Simple request', async () => {
      const response = await supertest(runHTTP())
        .get('/cors-10/')
        .set('Origin', origin);

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.body).toBe('Hello World');
      expect(response.get('Access-Control-Allow-Credentials')).toBe('true');
    });

    test('should enable Access-Control-Allow-Credentials on Preflight request', async () => {
      const response = await supertest(runHTTP())
        .options('/cors-10/')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'DELETE');

      expect(response.status).toBe(204);
      expect(response.get('Access-Control-Allow-Credentials')).toBe('true');
    });
  });

  describe('options.credentials unset', () => {
    ALL(
      '/cors-11/',
      [
        cors(),
      ],
      () => 'Hello World',
    );

    test('should disable Access-Control-Allow-Credentials on Simple request', async () => {
      const response = await supertest(runHTTP())
        .get('/cors-11/')
        .set('Origin', origin);

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.body).toBe('Hello World');
      expect(response.get('Access-Control-Allow-Credentials')).toBeFalsy();
    });

    test('should disable Access-Control-Allow-Credentials on Preflight request', async () => {
      const response = await supertest(runHTTP())
        .options('/cors-11/')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'DELETE');

      expect(response.status).toBe(204);
      expect(response.get('Access-Control-Allow-Credentials')).toBeFalsy();
    });
  });

  describe('options.credentials=function', () => {
    ALL(
      '/cors-12/*all',
      [
        cors({
          credentials(ctx) {
            return ctx.path !== '/cors-12/forbidden';
          },
        }),
      ],
      () => 'Hello World',
    );

    test('should enable Access-Control-Allow-Credentials on Simple request', async () => {
      const response = await supertest(runHTTP())
        .get('/cors-12/')
        .set('Origin', origin);

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.body).toBe('Hello World');
      expect(response.get('Access-Control-Allow-Credentials')).toBe('true');
    });

    test('should enable Access-Control-Allow-Credentials on Preflight request', async () => {
      const response = await supertest(runHTTP())
        .options('/cors-12/')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'DELETE');

      expect(response.status).toBe(204);
      expect(response.get('Access-Control-Allow-Credentials')).toBe('true');
    });

    test('should disable Access-Control-Allow-Credentials on Simple request', async () => {
      const response = await supertest(runHTTP())
        .get('/cors-12/forbidden')
        .set('Origin', origin);

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.body).toBe('Hello World');
      expect(response.get('Access-Control-Allow-Credentials')).toBeFalsy();
    });

    test('should disable Access-Control-Allow-Credentials on Preflight request', async () => {
      const response = await supertest(runHTTP())
        .options('/cors-12/forbidden')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'DELETE');

      expect(response.status).toBe(204);
      expect(response.get('Access-Control-Allow-Credentials')).toBeFalsy();
    });
  });

  describe('options.credentials=async function', () => {
    ALL(
      '/cors-13/',
      [
        cors({
          async credentials() {
            return Promise.resolve(true);
          },
        }),
      ],
      () => 'Hello World',
    );

    test('should enable Access-Control-Allow-Credentials on Simple request', async () => {
      const response = await supertest(runHTTP())
        .get('/cors-13/')
        .set('Origin', origin);

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.body).toBe('Hello World');
      expect(response.get('Access-Control-Allow-Credentials')).toBe('true');
    });

    test('should enable Access-Control-Allow-Credentials on Preflight request', async () => {
      const response = await supertest(runHTTP())
        .options('/cors-13/')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'DELETE');

      expect(response.status).toBe(204);
      expect(response.get('Access-Control-Allow-Credentials')).toBe('true');
    });
  });

  describe('options.allowHeaders', () => {
    test('should work with allowHeaders is string', async () => {
      ALL(
        '/cors-14/',
        [
          cors({
            allowHeaders: 'X-PINGOTHER',
          }),
        ],
        () => 'Hello World',
      );

      const response = await supertest(runHTTP())
        .options('/cors-14/')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'PUT');

      expect(response.status).toBe(204);
      expect(response.get('Access-Control-Allow-Headers')).toBe('X-PINGOTHER');
    });

    test('should work with allowHeaders is array', async () => {
      ALL(
        '/cors-15/',
        [
          cors({
            allowHeaders: ['X-PINGOTHER'],
          }),
        ],
        () => 'Hello World',
      );

      const response = await supertest(runHTTP())
        .options('/cors-15/')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'PUT');

      expect(response.status).toBe(204);
      expect(response.get('Access-Control-Allow-Headers')).toBe('X-PINGOTHER');
    });

    test('should set Access-Control-Allow-Headers to request access-control-request-headers header', async () => {
      ALL(
        '/cors-16/',
        [
          cors(),
        ],
        () => 'Hello World',
      );
      const response = await supertest(runHTTP())
        .options('/cors-16/')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'PUT')
        .set('access-control-request-headers', 'X-PINGOTHER');

      expect(response.status).toBe(204);
      expect(response.get('Access-Control-Allow-Headers')).toBe('X-PINGOTHER');
    });
  });

  describe('options.allowMethods', () => {
    test('should work with allowMethods is array', async () => {
      ALL(
        '/cors-17/',
        [
          cors({
            allowMethods: ['GET', 'POST'],
          }),
        ],
        () => 'Hello World',
      );

      const response = await supertest(runHTTP())
        .options('/cors-17/')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'PUT');

      expect(response.status).toBe(204);
      expect(response.get('Access-Control-Allow-Methods')).toBe('GET, POST');
    });

    test('should skip allowMethods', async () => {
      ALL(
        '/cors-18/',
        [
          cors({
            allowMethods: undefined,
          }),
        ],
        () => 'Hello World',
      );

      const response = await supertest(runHTTP())
        .options('/cors-18/')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'PUT');

      expect(response.status).toBe(204);
    });
  });

  describe('other middleware has been set `Vary` header to Accept-Encoding', () => {
    ALL(
      '/cors-19/',
      [
        async (ctx, next) => {
          ctx.response.setHeader('Vary', 'Accept-Encoding');
          await next();
        },
        cors(),
      ],
      () => 'Hello World',
    );

    test('should append `Vary` header to Origin', async () => {
      const response = await supertest(runHTTP())
        .get('/cors-19')
        .set('Origin', origin);

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.get('Vary')).toBe('Accept-Encoding, Origin');
      expect(response.body).toBe('Hello World');
    });
  });
});
