import runHTTP from './handlers/http';
import * as methods from './handlers/http/methods';

const http = {
  run: runHTTP,
  ...methods,
};

export default http;
