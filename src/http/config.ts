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
import https from 'https';
import { HTTPConfig, HTTPErrorHandler, HTTPMiddleware } from './types';

interface ConfigRef {
  value: HTTPConfig;
}

const CONFIG: ConfigRef = {
  value: {
    host: '0.0.0.0',
    port: 3000,
    globalMiddleware: [],
    errorHandlers: new Map<number, HTTPErrorHandler>(),
    env: process.env.NODE_ENV ?? 'development',
  },
};

export function patchConfig(newConfig: Partial<HTTPConfig>): void {
  const { value } = CONFIG;

  value.env = newConfig.env ?? value.env;
  value.host = newConfig.host ?? value.host;
  value.port = newConfig.port ?? value.port;
  value.globalMiddleware = newConfig.globalMiddleware ?? value.globalMiddleware;
  value.errorHandlers = newConfig.errorHandlers ?? value.errorHandlers;
  value.https = newConfig.https;
}

export function setErrorHandler(code: number, handler: HTTPErrorHandler): void {
  CONFIG.value.errorHandlers.set(code, handler);
}

export function getErrorHandler(code: number): HTTPErrorHandler | undefined {
  return CONFIG.value.errorHandlers.get(code);
}

export function hasErrorHandler(code: number): boolean {
  return CONFIG.value.errorHandlers.has(code);
}

export function enqueueGlobalMiddleware(middleware: HTTPMiddleware): void {
  CONFIG.value.globalMiddleware.unshift(middleware);
}

export function pushGlobalMiddleware(middleware: HTTPMiddleware): void {
  CONFIG.value.globalMiddleware.push(middleware);
}

export function getEnv(): string {
  return CONFIG.value.env;
}

export function getHost(): string {
  return CONFIG.value.host;
}

export function getPort(): number {
  return CONFIG.value.port;
}

export function getHTTPS(): https.ServerOptions | undefined {
  return CONFIG.value.https;
}

export function getGlobalMiddlewares(): HTTPMiddleware[] {
  return CONFIG.value.globalMiddleware;
}

export default CONFIG;
