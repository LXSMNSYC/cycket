'use strict';

const http = require('../../dist').default;

http.GET('/:greeting/:to', [], async (ctx) => ({
  [ctx.params.get('greeting')]: ctx.params.get('to') 
}));

http.run();
