# restal

[![](https://img.shields.io/npm/v/restal.svg)](https://www.npmjs.com/package/restal)
[![](https://img.shields.io/travis/Siubaak/restal.svg)](https://travis-ci.org/Siubaak/restal)

This is a simple restful api generator with express & mongoose.

## Install

```bash
$ npm i restal -S
```

## Usage

```js
// connect to mongodb and create a mongoose model
const mongoose = require('mongoose')
mongoose.Promise = Promise
mongoose.connect('mongodb://localhost/test', { useMongoClient: true })
const Post = new mongoose.Schema({
    title: String,
    content: { type: String, required: true },
    classification: String
})
const post = mongoose.model('post', Post)

// create a express app
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
app.use(bodyParser.json())

// import restal
const Restal = require('restal')
// create a restal instance with a model, and mount it on a uri
const postApis = new Restal(post, '/post')
// inject the apis into the express app
postApis.inject(app)

// listening
app.listen(8000)
```

### Public Fields & Methods


| constructor            | remark                       |
| ---------------------- | ---------------------------- |
| new restal(model, uri) | create a restal api instance |

| public field | remark                                    |
| ------------ | ----------------------------------------- |
| uri          | the uri that restal instance mounted      |
| model        | the model that restal instance associated |

| public method               | remark                               |
| --------------------------- | ------------------------------------ |
| inject(app)                 | inject the apis into the express app |
| preHandle(method, handler)  | unshift pre-hanlde middleware(s)     |
| postHandle(method, handler) | push post-hanlde middleware(s)       |

## APIs

APIs are generated by restal when the restal instance created. And the APIs support five HTTP methods listed below.

| method | query params        | json body           | remark                     |
| ------ | ------------------- | ------------------- | -------------------------- |
| GET    | id, cond, skip, num | (none)              | get document(s)            |
| POST   | (none)              | document            | create document            |
| PUT    | id                  | document            | update the whole document  |
| PATCH  | id                  | some document props | update some document props |
| DELETE | id, cond            | (none)              | delete document(s)         |

After injection, APIs are routed by the express app and become active when the app is listening. The request body type of POST, PUT and PATCH is json and all responses are in json. So, the express app need to use body-parser before being injected.

### GET

| query params | type          | requirement | remark                                     |
| ------------ | ------------- | ----------- | ------------------------------------------ |
| id           | ObjectID(_id) | optional    | highest priority, ignore other params      |
| cond         | object        | optional    | query object for mongodb, see [mongodb manual](https://docs.mongodb.com/manual) |
| skip         | number        | optional    | number of documents skipped, default 0     |
| num          | number        | optional    | number of documents requested, default all |

No request body is needed. If all query params are missing, all documents of the collection will be responsed.

### POST

No query params needed but request body (the document object to create) is required in json.

### PUT

| query params | type          | requirement | remark                                    |
| ------------ | ------------- | ----------- | ----------------------------------------- |
| id           | ObjectID(_id) | required    | locate the document needed to be updated  |

The request body (the document object to update) is also required in json. The offered document will overwrite the whole original document in mongodb.

### PATCH

| query params | type          | requirement | remark                                    |
| ------------ | ------------- | ----------- | ----------------------------------------- |
| id           | ObjectID(_id) | required    | locate the document needed to be updated  |

The request body (some document props to update) is also required in json. The offered document props will overwrite those of original document in mongodb.

### DELETE

| query params | type          | requirement | remark                                |
| ------------ | ------------- | ----------- | ------------------------------------- |
| id           | ObjectID(_id) | required    | highest priority, ignore "cond" param |
| cond         | object        | optional    | query object for mongodb, see [mongodb manual](https://docs.mongodb.com/manual) |

No request body is needed. 

## Extention

Features of express middleware are fully maintained in restal, and it's convenient to extend the restal instance handlers.

```js
// import restal
const Restal = require('restal')
// create a restal instance with a model, and mount it on a uri
const postApis = new Restal(post, '/post')

//              ----+----+----+---------+----+----+----
// preHandle -> ... | f2 | f1 | handler | f1 | f2 | ... <- postHandle
//              ----+----+----+---------+----+----+----

// add middleware(s) to pre-hanlde or intercept the request
postApis.preHandle('get', (req, res, next) => {
    const postModel = postApis.model
    const postUri = postApis.uri
    // do something here like authorization check
    
    // if next misses, original handler will be blocked
    // you need to reponse on your own
    next()
})
// add middleware to post-handle the result
postApis.postHandle('get', (result, req, res, next) => {
    const postModel = postApis.model
    const postUri = postApis.uri
    // do somethind here like data processing

    // if you push post handler, the orignal handler won't
    // reponse the request and pass the orignal reponse to
    // post handler with param "result"

    // you need to reponse on your own
    res.status(200).send(result)
})

// inject the apis into the express app
postApis.inject(app)
```
