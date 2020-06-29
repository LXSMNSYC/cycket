'use strict'

const express = require('express')

const app = express()

app.disable('etag')
app.disable('x-powered-by')

app.get('/:greeting/:to', function (req, res) {
  res.json({ [req.params.greeting]: req.params.to })
})

app.listen(3000)