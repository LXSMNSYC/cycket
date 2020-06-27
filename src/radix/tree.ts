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
/**
 * Core dependency
 */
import { RadixNode, createRadixNode, sortRadixNodeChildren, setRadixNodeKey } from './node';
import { RadixResult, createRadixResult, useRadixResultNode } from './result';

/**
 * Exceptions
 */
import DuplicateError from './exceptions/duplicate-error';
import SharedKeyError from './exceptions/shared-key-error';

/**
 * Utilities
 */
import Reader from '../utils/reader';

function isSameKey(path: string, key: string): boolean {
  const pr = new Reader(path);
  const kr = new Reader(key);

  let different = false;

  while ((pr.notDone() && pr.current() !== '/') && (kr.notDone() && kr.current() !== '/')) {
    if (pr.current() !== kr.current()) {
      different = true;
      break;
    }
    pr.next();
    kr.next();
  }

  return (!different) && (pr.current() === '/' || !pr.notDone());
}

function checkMarkers(char: string): boolean {
  return (char === '/' || char === ':' || char === '*');
}

function isSharedKey(path: string, key: string): boolean {
  const pr = new Reader(path);
  const kr = new Reader(key);

  if (pr.current() !== kr.current() && checkMarkers(kr.current())) {
    return false;
  }

  let different = false;

  while ((pr.notDone() && !checkMarkers(pr.current())) && (kr.notDone() && !checkMarkers(kr.current()))) {
    if (pr.current() !== kr.current()) {
      different = true;
      break;
    }

    pr.next();
    kr.next();
  }

  return (!different) && (!kr.notDone() || checkMarkers(kr.current()));
}

function detectParamSize(reader: Reader) {
  const oldPos = reader.index;

  while (reader.notDone() && reader.current() !== '/') {
    reader.next();
  }

  const count = reader.index - oldPos;

  reader.index = oldPos;

  return count;
}

function innerAdd<T>(path: string, payload: T, node: RadixNode<T>) {
  const kr = new Reader(node.key);
  const pr = new Reader(path);

  while (kr.notDone() && pr.notDone()) {
    if (pr.current() !== kr.current()) {
      break;
    }

    pr.next();
    kr.next();
  }

  if (pr.index === 0 || (pr.index < pr.size && pr.index >= kr.size)) {
    let added = false;

    const newKey = path.slice(pr.index);

    for (const child of node.children) {
      if (child.key[0] === ':' && newKey[0] === ':') {
        if (!isSameKey(newKey, child.key)) {
          throw new SharedKeyError(newKey, child.key);
        }
      } else if (child.key[0] !== newKey[0]) {
        continue;
      }

      added = true;
      innerAdd(newKey, payload, child);
      break;
    }

    if (!added) {
      node.children.push(createRadixNode(newKey, payload));
    }

    sortRadixNodeChildren(node);
  } else if (pr.index === pr.size && pr.index === kr.size) {
    if (node.payload) {
      throw new DuplicateError(path);
    }

    node.payload = payload;
  } else if (pr.index > 0 && pr.index < kr.size) {
    const newNode = createRadixNode(
      node.key.slice(pr.index),
      node.payload,
    );

    newNode.children = [...node.children];

    setRadixNodeKey(node, path.slice(0, pr.index));
    node.children = [ newNode ];

    if (pr.index < pr.size) {
      node.children.push(createRadixNode(path.slice(pr.index), payload));

      sortRadixNodeChildren(node);

      node.payload = undefined;
    } else {
      node.payload = payload;
    }
  }
}

function innerFind<T>(
  path: string,
  result: RadixResult<T>,
  node: RadixNode<T>,
  first: boolean = false,
) {
  const pl = path.length;
  const kl = node.key.length;

  if (first && (pl === kl && path === node.key) && node.payload) {
    useRadixResultNode(result, node);

    return;
  }

  const kr = new Reader(node.key);
  const pr = new Reader(path);

  while (kr.notDone() && pr.notDone()
    && (kr.current() === '*' || kr.current() === ':' || pr.current() === kr.current())
  ) {
    switch (kr.current()) {
      case '*':
        result.params.set(
          node.key.slice(kr.index + 1),
          path.slice(pr.index),
        );
        useRadixResultNode(result, node);

        return;
      case ':':
        const keySize = detectParamSize(kr);
        const pathSize = detectParamSize(pr);

        result.params.set(
          node.key.slice(kr.index + 1, kr.index + keySize),
          path.slice(pr.index, pr.index + pathSize),
        );

        kr.index += keySize;
        pr.index += pathSize;

        break;
      default:
        kr.next();
        pr.next();
        break;
    }
  }

  if (!(pr.notDone() || kr.notDone()) && node.payload) {
    useRadixResultNode(result, node);

    return;
  }

  if (pr.notDone()) {
    if (kl > 0 && (pr.index + 1 === pl) && (pr.current() === '/')) {
      useRadixResultNode(result, node);

      return;
    }

    const newPath = path.slice(pr.index);

    for (const child of node.children) {
      if ((child.key[0] === '*' || child.key[0] === ':') || isSharedKey(newPath, child.key)) {
        useRadixResultNode(result, node, false);

        innerFind(newPath, result, child);

        return;
      }
    }

    return;
  }

  if (kr.notDone()) {
    if (kr.index + 1 === kl && kr.current() === '/') {
      useRadixResultNode(result, node);

      return;
    }

    if (kr.index < kl && (
      (kr.current() === '/' && kr.peek() === '*') || kr.current() === '*'
    )) {
      if (kr.current() !== '*') {
        kr.next();
      }

      result.params.set(node.key.slice(kr.index + 1), '');

      useRadixResultNode(result, node);

      return;
    }
  }
}

export interface RadixTree<T> {
  root: RadixNode<T>;
}

export function createRadixTree<T>(): RadixTree<T> {
  return {
    root: createRadixNode<T>('', undefined, true),
  };
}

export function addRadixTreePath<T>(tree: RadixTree<T>, path: string, payload: T) {
  if (tree.root.placeholder) {
    tree.root = createRadixNode(path, payload);
  } else {
    innerAdd<T>(path, payload, tree.root);
  }
}

export function findRadixTreeResult<T>(tree: RadixTree<T>, path: string): RadixResult<T> {
  const result = createRadixResult<T>();

  innerFind(path, result, tree.root, true);

  return result;
}
