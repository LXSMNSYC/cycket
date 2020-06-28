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
import { Context, JSONValue } from './types';
import {
  CachedRadix, findCachedRadixResult,
} from './cached-radix';
import RouteNotFoundError from './errors/route-not-found';

export type NextFunction = () => Promise<boolean>;

export type Middleware<C extends Context> = (ctx: C, next: NextFunction) => void | Promise<void>;

export type Listener<C extends Context> = (ctx: C) => JSONValue | Promise<JSONValue>;

export interface Stack<C extends Context> {
  middlewares: Middleware<C>[];
  listener?: Listener<C>;
  tree?: CachedRadix<Stack<C>>;
}

export function createStack<C extends Context>(
  middlewares: Middleware<C>[] = [],
  listener?: Listener<C>,
): Stack<C> {
  return {
    middlewares,
    listener,
  };
}

export function getRadixPath(method: string, path: string): string {
  return `/${method.toLowerCase()}${path}`;
}

export function concatStack<C extends Context>(base: Stack<C>, stack: Stack<C>): void {
  base.middlewares = base.middlewares.concat(stack.middlewares);
  base.listener = stack.listener;
}

export async function runMiddleware<C extends Context>(
  middlewares: Middleware<C>[],
  ctx: C,
  index = 0,
): Promise<boolean> {
  if (middlewares.length > index) {
    await middlewares[index](ctx, () => runMiddleware(middlewares, ctx, index + 1));
    // Check if there are next middleware
    return true;
  }
  return false;
}

export async function runStack<C extends Context>(
  base: Stack<C>,
  ctx: C,
): Promise<JSONValue> {
  // Run all middlewares
  await runMiddleware(base.middlewares, ctx);

  // Middleware has finished, run the end listener
  if (base.listener) {
    return base.listener(ctx);
  }

  // We could be evaluating upon a tree
  // Run the internal stack instead.
  if (base.tree) {
    const result = findCachedRadixResult(base.tree, getRadixPath(ctx.method, ctx.path));

    if (!result.payload) {
      throw new RouteNotFoundError(ctx);
    }
    ctx.params = result.params;
    return runStack(result.payload, ctx);
  }

  return null;
}
