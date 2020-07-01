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

import { HTTPConfig, HTTPContext } from './types';
import { runMiddleware } from '../stack';
import {
  patchConfig,
  enqueueGlobalMiddleware,
  pushGlobalMiddleware,
  hasErrorHandler,
  setErrorHandler,
  getEnv,
  getGlobalMiddlewares,
  getHTTPS,
  getPort,
  getHost,
} from './config';

// Middlewares
// import HTTP_RESPONSE_TIME_MIDDLEWARE from './middlewares/response-time';
import HTTP_ERROR_MIDDLEWARE from './middlewares/error';
import HTTP_ROUTER_MIDDLEWARE from './middlewares/router';

export default function runHTTP(config: Partial<HTTPConfig> = {}): http.Server | https.Server {
  patchConfig(config);

  /**
   * add global middleware
   */
  // enqueueGlobalMiddleware(HTTP_RESPONSE_TIME_MIDDLEWARE);
  enqueueGlobalMiddleware(HTTP_ERROR_MIDDLEWARE);
  pushGlobalMiddleware(HTTP_ROUTER_MIDDLEWARE);

  if (!hasErrorHandler(404)) {
    setErrorHandler(404, () => 'Not Found');
  }

  if (!hasErrorHandler(500)) {
    setErrorHandler(500, (_, error) => (
      getEnv() === 'development' ? (error.stack ?? error.message) : 'An error occured'
    ));
  }

  const credentials = getHTTPS();

  const prefix = credentials ? 'https://' : 'http://';

  /**
   * Add error handlers
   */
  const listener: http.RequestListener = (request, response) => {
    if (request.method && request.url) {
      runMiddleware<HTTPContext>(
        getGlobalMiddlewares(),
        {
          method: request.method,
          path: new URL(request.url, `${prefix}${getHost()}`).pathname,
          request,
          response,
          state: {},
          params: {},
        },
      ).catch(() => {
        // handle error
      });
    }
  };

  const server = credentials
    ? https.createServer(credentials, listener)
    : http.createServer(listener);

  server.listen(
    getPort(),
    getHost(),
  );

  return server;
}
