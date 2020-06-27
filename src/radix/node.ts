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
import { compare, Comparison } from '../utils/compare';
import Reader from '../utils/reader';

export enum Kind {
  Normal,
  Named,
  Glob
}

function computePriority(key: string): [Kind, number] {
  const keyReader = new Reader(key);

  while (keyReader.notDone()) {
    const char = keyReader.current();
    switch (char) {
      case '*':
        return [Kind.Glob, keyReader.index];
      case ':':
        return [Kind.Named, keyReader.index];
      default:
        keyReader.next();
        break;
    }
  }

  return [Kind.Normal, keyReader.index];
}

export interface RadixNode<T> {
  payload?: T;
  children: RadixNode<T>[];
  key: string;
  placeholder: boolean;
  kind: Kind;
  priority: number;
}

export function setRadixNodeKey<T>(node: RadixNode<T>, key: string) {
  const [kind, priority] = computePriority(key);

  node.kind = kind;
  node.priority = priority;
  node.key = key;
}

export function createRadixNode<T>(
  key: string,
  payload?: T,
  placeholder: boolean = false,
): RadixNode<T> {
  const [kind, priority] = computePriority(key);

  return {
    key,
    kind,
    priority,
    children: [],
    placeholder,
    payload,
  };
}

export function compareRadixNode<T>(a: RadixNode<T>, b: RadixNode<T>): Comparison {
  const result = compare(a.kind, b.kind);

  if (result !== 0) {
    return result;
  }

  return compare(b.priority, a.priority);
}

export function sortRadixNodeChildren<T>(node: RadixNode<T>) {
  node.children.sort(compareRadixNode);
}
