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

import { HTTPMiddleware, HTTPContext } from '../types';
import { setVary } from '../../utils/vary';

type OptionalString = string | undefined;
type CORSOrigin = OptionalString | ((ctx: HTTPContext) => OptionalString | Promise<OptionalString>);
type CORSCredentials = boolean | ((ctx: HTTPContext) => boolean | Promise<boolean>);
export interface HTTPCORSConfig {
  allowMethods: string | string[];
  origin?: CORSOrigin;
  exposeHeaders?: string | string[];
  allowHeaders?: string | string[];
  maxAge?: string | number;
  credentials?: CORSCredentials;
}

const DEFAULT: HTTPCORSConfig = {
  allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
};

async function getCredentials(credentials: CORSCredentials, ctx: HTTPContext): Promise<boolean> {
  if (typeof credentials === 'boolean') {
    return credentials;
  }
  return credentials(ctx);
}

export default function createHTTPCORS(config: Partial<HTTPCORSConfig> = {}): HTTPMiddleware {
  const currentConfig: HTTPCORSConfig = {
    ...DEFAULT,
    ...config,
  };

  if (Array.isArray(currentConfig.allowHeaders)) {
    currentConfig.allowHeaders = currentConfig.allowHeaders.join(', ');
  }
  if (Array.isArray(currentConfig.exposeHeaders)) {
    currentConfig.exposeHeaders = currentConfig.exposeHeaders.join(', ');
  }
  if (Array.isArray(currentConfig.allowMethods)) {
    currentConfig.allowMethods = currentConfig.allowMethods.join(', ');
  }
  if (currentConfig.maxAge) {
    currentConfig.maxAge = currentConfig.maxAge.toString();
  }

  return async (ctx, next) => {
    const requestOrigin = ctx.request.headers.origin;

    setVary(ctx.response, 'Origin');

    if (!requestOrigin) {
      await next();
      return;
    }

    let currentOrigin: OptionalString;

    const { credentials, origin } = currentConfig;

    if (typeof origin === 'function') {
      currentOrigin = await origin(ctx);

      if (!currentOrigin) {
        await next();
        return;
      }
    } else {
      currentOrigin = origin ?? requestOrigin;
    }

    const currentCredentials = credentials && await getCredentials(credentials, ctx);

    if (ctx.method !== 'OPTIONS') {
      ctx.response.setHeader('Access-Control-Allow-Origin', currentOrigin);

      if (currentCredentials) {
        ctx.response.setHeader('Access-Control-Allow-Credentials', 'true');
      }

      if (currentConfig.exposeHeaders) {
        ctx.response.setHeader('Access-Control-Expose-Headers', currentConfig.exposeHeaders);
      }
      await next();
    } else {
      if (!ctx.request.headers['access-control-request-method']) {
        await next();
        return;
      }

      ctx.response.setHeader('Access-Control-Allow-Origin', currentOrigin);

      if (currentCredentials) {
        ctx.response.setHeader('Access-Control-Allow-Credentials', 'true');
      }

      if (currentConfig.maxAge) {
        ctx.response.setHeader('Access-Control-Max-Age', currentConfig.maxAge);
      }

      if (currentConfig.allowMethods) {
        ctx.response.setHeader('Access-Control-Allow-Methods', currentConfig.allowMethods);
      }

      const allowHeaders = currentConfig.allowHeaders ?? ctx.request.headers['access-control-request-headers'];

      if (allowHeaders) {
        ctx.response.setHeader('Access-Control-Allow-Headers', allowHeaders);
      }

      ctx.response.statusCode = 204;
    }
  };
}
