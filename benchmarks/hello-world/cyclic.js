'use strict';

const http = require('../../dist').default;

http.GET('/', [], async () => ({
  hello: 'world',
}));

http.run();
