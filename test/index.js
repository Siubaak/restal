const assert = require('assert')

const model = require('./model')
const Restal = require('../index')
const express = require('express')
const bodyParser = require('body-parser')

const app = express()

app.use(bodyParser.json())
const userApi = new Restal(model.user, '/user')
const postApi = new Restal(model.post, '/post')
postApi

userApi.inject(app)
postApi.inject(app)

app.listen(8000)