# cyclic
A simple HTTP framework for NodeJS

## Features
- Supports HTTP/HTTPS (HTTP/2 and WebSockets soon).
- Strict routing (no fall-throughs nor optional named/glob parameters).

## Install

## Example

```ts
import { http } from '@lxsmnsyc/cyclic';

http.GET('/', [], () => (
  'Hello World'
));

http.GET('/:name', [], (ctx) => (
  'Hello ' + ctx.params.get('name')
));

http.run();
```