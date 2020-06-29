'use strict'

const fastify = require('fastify')()

fastify.get('/:greeting/:to', function (req, reply) {
  reply.send({ [req.params.greeting]: req.params.to })
})

fastify.listen(3000)