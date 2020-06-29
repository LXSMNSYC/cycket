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
import { HTTPListener, HTTPMiddleware } from './types';
import { createStack } from '../stack';
import PathSyntaxError from '../errors/path-syntax';
import { addHTTPHandlerStack } from './middlewares/router';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

export function ALL(
  path: string,
  middlewares?: HTTPMiddleware[],
  listener?: HTTPListener,
): void {
  if (!path) {
    throw new PathSyntaxError(path);
  }
  const stack = createStack(middlewares, listener);
  METHODS.forEach((method) => {
    addHTTPHandlerStack(method, path, stack);
  });
}

function useMethod(
  method: string,
  path: string,
  middlewares?: HTTPMiddleware[],
  listener?: HTTPListener,
) {
  if (!path) {
    throw new PathSyntaxError(path);
  }
  const stack = createStack(middlewares, listener);
  addHTTPHandlerStack(method, path, stack);
}

export function GET(
  path: string,
  middlewares?: HTTPMiddleware[],
  listener?: HTTPListener,
): void {
  useMethod('GET', path, middlewares, listener);
}

export function POST(
  path: string,
  middlewares?: HTTPMiddleware[],
  listener?: HTTPListener,
): void {
  return useMethod('POST', path, middlewares, listener);
}

export function PATCH(
  path: string,
  middlewares?: HTTPMiddleware[],
  listener?: HTTPListener,
): void {
  return useMethod('PATCH', path, middlewares, listener);
}

export function PUT(
  path: string,
  middlewares?: HTTPMiddleware[],
  listener?: HTTPListener,
): void {
  return useMethod('PUT', path, middlewares, listener);
}

export function DELETE(
  path: string,
  middlewares?: HTTPMiddleware[],
  listener?: HTTPListener,
): void {
  return useMethod('DELETE', path, middlewares, listener);
}

export function OPTIONS(
  path: string,
  middlewares?: HTTPMiddleware[],
  listener?: HTTPListener,
): void {
  return useMethod('OPTIONS', path, middlewares, listener);
}
