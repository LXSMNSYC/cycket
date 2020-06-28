/**
 * @license
 * MIT License
 *
 * Copyright (c) 2020 Alexis Munsayac
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 *
 * @author Alexis Munsayac <alexis.munsayac@gmail.com>
 * @copyright Alexis Munsayac 2020
 */
import http from 'http';
import https from 'https';

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

export default function runHTTP(config: Partial<HTTPConfig> = {}): http.Server | https.Server {
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
  const listener: http.RequestListener = (request, response) => {
    if (request.method && request.url) {
      runMiddleware<HTTPContext>(
        defaultConfig.globalMiddleware,
        {
          method: request.method,
          path: new URL(request.url, `http://${defaultConfig.host}`).pathname,
          request,
          response,
          state: new Map<string, unknown>(),
        },
      ).catch(() => {
        // handle error
      });
    }
  };

  const server = defaultConfig.https == null
    ? http.createServer(listener)
    : https.createServer(defaultConfig.https);

  server.listen(
    defaultConfig.port,
    defaultConfig.host,
  );

  return server;
}
