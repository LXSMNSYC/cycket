import { createServer, Server } from 'http';
import { HTTPConfig, HTTPErrorHandler, HTTPContext } from './types';
import { createHTTPMiddleware } from './server';
import createHTTPErrorMiddleware from './error';
import { runMiddleware } from '../../stack';

const DEFAULT_HTTP_CONFIG: HTTPConfig = {
  host: '0.0.0.0',
  port: 3000,
  globalMiddleware: [],
  errorHandlers: new Map<number, HTTPErrorHandler>(),
};

export default function runHTTP(config: Partial<HTTPConfig> = {}): Server {
  const defaultConfig: HTTPConfig = {
    ...DEFAULT_HTTP_CONFIG,
    ...config,
  };

  defaultConfig.globalMiddleware.push(
    createHTTPErrorMiddleware(defaultConfig),
    createHTTPMiddleware(defaultConfig),
  );

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
