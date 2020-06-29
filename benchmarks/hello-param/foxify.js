'use strict'

const Foxify = require('foxify')

const app = new Foxify()

app.disable('x-powered-by')

app.set('workers', 1)

app.get('/:greeting/:to', function (req, reply) {
  reply.send({ [req.params.greeting]: req.params.to })
})

app.start()