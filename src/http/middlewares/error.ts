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
import RouteNotFoundError from '../../errors/route-not-found';
import { HTTPContext, HTTPMiddleware } from '../types';
import HTTPError from '../errors/http-error';
import { getErrorHandler, hasErrorHandler } from '../config';

async function callErrorWithStatusCode(
  ctx: HTTPContext,
  error: Error,
  statusCode: number,
) {
  // Attempt to get the code-specific error handler
  if (hasErrorHandler(statusCode)) {
    const errorHandler = getErrorHandler(statusCode);

    if (errorHandler) {
      // Attempt to set the header to text/html
      if (!ctx.response.hasHeader('Content-Type')) {
        ctx.response.setHeader('Content-Type', 'text/html');
      }
      // Update status code and process error
      ctx.response.statusCode = statusCode;
      ctx.response.end(await errorHandler(ctx, error));
    }
  }
}

const HTTP_ERROR_MIDDLEWARE: HTTPMiddleware = async (ctx, next) => {
  try {
    // Switch to next middleware stack to handle their errors
    await next();
  } catch (error) {
    if (error instanceof RouteNotFoundError) {
      await callErrorWithStatusCode(ctx, error, 404);
    } else if (error instanceof HTTPError) {
      await callErrorWithStatusCode(ctx, error, ctx.response.statusCode);
    } else {
      await callErrorWithStatusCode(ctx, error, 500);
    }
  }
};

export default HTTP_ERROR_MIDDLEWARE;
