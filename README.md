# cyclic
A simple HTTP framework for NodeJS

## Features
- Supports HTTP/HTTPS (HTTP/2 and WebSockets soon).
- Strict routing (no fall-throughs nor optional named/glob parameters).

## Install

## Example

### Simple server

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

## Goals

### Core

[X] HTTP
[X] HTTPS
[ ] WebSockets
[ ] HTTP/2

## Middlewares

[X] Router
[X] Error
[X] Response Time
[ ] Body Parser
[ ] Static File Server
[X] CORS
