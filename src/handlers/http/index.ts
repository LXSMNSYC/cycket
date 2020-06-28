import { createServer, Server } from 'http';
import { HTTPConfig, HTTPErrorHandler, HTTPContext } from './types';
import { createHTTPMiddleware } from './server';
import createHTTPErrorMiddleware from './error';
import { runMiddleware } from '../../stack';
import { ERROR } from './methods';

const DEFAULT_HTTP_CONFIG: HTTPConfig = {
  host: '0.0.0.0',
  port: 3000,
  globalMiddleware: [],
  errorHandlers: new Map<number, HTTPErrorHandler>(),
  env: process.env.NODE_ENV ?? 'development',
};

export default function runHTTP(config: Partial<HTTPConfig> = {}): Server {
  const defaultConfig: HTTPConfig = {
    ...DEFAULT_HTTP_CONFIG,
    ...config,
  };

  /**
   * push global middleware
   */
  defaultConfig.globalMiddleware.push(
    createHTTPErrorMiddleware(defaultConfig),
    createHTTPMiddleware(defaultConfig),
  );

  if (!defaultConfig.errorHandlers.has(404)) {
    ERROR(defaultConfig, 404, (ctx) => {
      if (!ctx.response.hasHeader('Content-Type')) {
        ctx.response.setHeader('Content-Type', 'text/html');
      }
      ctx.response.statusCode = 404;
      return 'Not Found';
    });
  }

  if (!defaultConfig.errorHandlers.has(500)) {
    ERROR(defaultConfig, 500, (ctx, error) => {
      if (!ctx.response.hasHeader('Content-Type')) {
        ctx.response.setHeader('Content-Type', 'text/html');
      }
      ctx.response.statusCode = 500;
      return defaultConfig.env === 'development' ? (error.stack ?? error.message) : 'An error occured';
    });
  }

  /**
   * Add error handlers
   */
  const server = createServer((request, response) => {
    if (request.method && request.url) {
      runMiddleware<HTTPContext>(
        defaultConfig.globalMiddleware,
        {
          method: request.method,
          path: new URL(request.url, `http://${defaultConfig.host}`).pathname,
          request,
          response,
        },
      ).catch(() => {
        // handle error
      });
    }
  });

  server.listen(
    defaultConfig.port,
    defaultConfig.host,
  );

  return server;
}
