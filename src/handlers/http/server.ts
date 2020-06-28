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

import { createCachedRadix, addCachedRadixPayload, findCachedRadixResult } from '../../cached-radix';
import {
  HTTPHandler, HTTPConfig, HTTPStack, HTTPMiddleware,
} from './types';
import {
  getRadixPath, concatStack, addStackSubTree, createStack, runStack,
} from '../../stack';
import { createRadixTree, addRadixTreePath, findRadixTreeResult } from '../../radix/tree';
import RouteSpecificityError from '../../errors/route-specificity';
import ListenerAlreadyExistsError from '../../errors/listener-already-exists';
import RouteNotFoundError from '../../errors/route-not-found';
import HTTPError from './errors/http-error';

const INSTANCE: HTTPHandler = {
  tree: createCachedRadix(),
  radixPaths: [],
};

export function clearHTTPHandler(): void {
  INSTANCE.tree = createCachedRadix();
  INSTANCE.radixPaths = [];
}

export function addHTTPHandlerTree(
  node: string,
  stack: HTTPStack,
): void {
  addCachedRadixPayload(INSTANCE.tree, node, stack);
  INSTANCE.radixPaths.push(node);
}

export function addHTTPHandlerStack(
  method: string,
  path: string,
  stack: HTTPStack,
): void {
  const node = getRadixPath(method, path);

  INSTANCE.radixPaths.forEach((existingPath) => {
    const tree = createRadixTree();
    addRadixTreePath(tree, node, node);
    const result = findRadixTreeResult(tree, existingPath);

    if (result.payload === node) {
      throw new RouteSpecificityError(existingPath, node);
    }
  });

  const result = findCachedRadixResult(INSTANCE.tree, node);

  if (result.payload) {
    if (result.payload.listener) {
      throw new ListenerAlreadyExistsError(method, path);
    }
    if (result.key === node) {
      concatStack(result.payload, stack);
    } else {
      addStackSubTree(result.payload, stack, node, method, path);
    }
  } else {
    addHTTPHandlerTree(node, stack);

    if (method === 'GET') {
      addHTTPHandlerTree(
        getRadixPath('HEAD', path),
        createStack([], () => ''),
      );
    }
  }
}

export function createHTTPMiddleware(config: HTTPConfig): HTTPMiddleware {
  return async (ctx) => {
    try {
      const node = getRadixPath(ctx.method, ctx.path);

      const result = findCachedRadixResult(INSTANCE.tree, node);

      if (!result.payload) {
        throw new RouteNotFoundError(ctx);
      }

      ctx.params = result.params;

      const content = await runStack(result.payload, ctx);
      if (!ctx.response.writableEnded) {
        ctx.response.end(JSON.stringify(content));
      }
    } finally {
      const errorHandler = config.errorHandlers.has(ctx.response.statusCode);
      if (errorHandler) {
        // eslint-disable-next-line no-unsafe-finally
        throw new HTTPError(ctx);
      }
    }
  };
}
