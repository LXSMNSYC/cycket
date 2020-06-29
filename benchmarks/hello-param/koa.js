var Koa = require('koa');
var Router = require('koa-router');

var app = new Koa();
var router = new Router();

router.get('/:greeting/:to', (ctx, next) => {
  ctx.body = { [ctx.params.greeting]: ctx.params.to };
});

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000);