// create mongoose model
const mongoose = require('mongoose')
mongoose.Promise = Promise
mongoose.connect('mongodb://localhost/test', { useMongoClient: true })
const Post = new mongoose.Schema({
	title: {
		type: String,
		required: true
	},
	content: {
		type: String,
		required: true
	},
	classification: String
})
const post = mongoose.model('post', Post)

// begin testing
const uri = '/post'
const Restal = require('./index')
const express = require('express')
const bodyParser = require('body-parser')
const supertest = require('supertest')

describe('Testing restal', () => {
	// create express app
	const app1 = express()
	app1.use(bodyParser.json())

	// create restal api instance
	const postApis = new Restal(post, uri)
	postApis.inject(app1)
	const request1 = supertest(app1)
	it('should clean the mongodb', done => {
		request1
			.delete(uri)
			.expect(200, done)
	})
	it('should get no posts', done => {
		request1
			.get(uri)
			.expect(res => {
				if (res.body.length !== 0)
					throw new Error("there're posts in mongodb")
			})
			.expect(200, done)
	})
	it('should create a post', done => {
		request1
			.post(uri)
			.send({
				title: 'Restal',
				content: "It's pretty awesome!",
				classification: 'Restful'
			})
			.expect(200, done)
	})
	it('should create another post', done => {
		request1
			.post(uri)
			.send({
				title: 'Mongoose',
				content: "It's pretty great!"
			})
			.expect(200, done)
	})
	it('should get two posts', done => {
		request1
			.get(uri)
			.expect(res => {
				if (res.body.length !== 2)
					throw new Error('there should be two posts')
			})
			.expect(200, done)
	})
	it('should get two posts again', done => {
		request1
			.get(uri)
			.query({ skip: 0, num: 0 })
			.expect(res => {
				if (res.body.length !== 2)
					throw new Error('there should be two posts')
			})
			.expect(200, done)
	})
	let id
	it('should get the 2nd post', done => {
		request1
			.get(uri)
			.query({
				skip: 1,
				num: 1
			})
			.expect(res => {
				if (res.body.length !== 1)
					throw new Error('there should be only one post')
				const post2 = res.body[0]
				if (post2.title !== 'Mongoose') throw new ErrNoor('wrong title')
				if (post2.content !== "It's pretty great!") throw new Error('wrong content')
				if (post2.classification) throw new Error("it shouldn't have classification")
				id = post2._id
			})
			.expect(200, done)
	})
	it('should get the 2nd post again by id', done => {
		request1
			.get(uri)
			.query({ id: id, cond: '{"title":"Restal"}'})
			.expect(res => {
				const post2 = res.body
				if (post2.title !== 'Mongoose') throw new Error('wrong title')
				if (post2.content !== "It's pretty great!") throw new Error('wrong content')
				if (post2.classification) throw new Error("it shouldn't have classification")
			})
			.expect(200, done)
	})
	it('should get the 1st post by condition', done => {
		request1
			.get(uri)
			.query({ cond: '{"title":"Restal"}' })
			.expect(res => {
				if (res.body.length !== 1)
					throw new Error('there should be only one post')
				const post1 = res.body[0]
				if (post1.title !== 'Restal') throw new Error('wrong title')
				if (post1.content !== "It's pretty awesome!") throw new Error('wrong content')
				if (post1.classification !== 'Restful') throw new Error('wrong classification')
			})
			.expect(200, done)
	})
	it("should update the 2nd post's classification", done => {
		request1
			.patch(uri)
			.query({ id: id })
			.send({ classification: 'Mongodb' })
			.expect(200, done)
	})
	it('should only successfully update classification', done => {
		request1
			.get(uri)
			.query({ id: id })
			.expect(res => {
				const post2 = res.body
				if (post2.title !== 'Mongoose') throw new Error('wrong title')
				if (post2.content !== "It's pretty great!") throw new Error('wrong content')
				if (post2.classification !== 'Mongodb') throw new Error('wrong classification')
			})
			.expect(200, done)
	})
	it('should update the whole 2nd post', done => {
		request1
			.put(uri)
			.query({ id: id })
			.send({
				title: 'Express',
				content: "It's insanely good!"
			})
			.expect(200, done)
	})
	it('should successfully update the whole post', done => {
		request1
			.get(uri)
			.query({ id: id })
			.expect(res => {
				const post2 = res.body
				if (post2.title !== 'Express') throw new Error('wrong title')
				if (post2.content !== "It's insanely good!") throw new Error('wrong content')
				if (post2.classification) throw new Error("it shouldn't have classification")
			})
			.expect(200, done)
	})
	it('should delete the 2nd post', done => {
		request1
			.delete(uri)
			.query({ id: id })
			.expect(200, done)
	})
	it('should remain only one post', done => {
		request1
			.get(uri)
			.expect(res => {
				if (res.body.length !== 1)
					throw new Error('there should be only one post')
			})
			.expect(200, done)
	})
	it('should delete all posts', done => {
		request1
			.delete(uri)
			.expect(200, done)
	})
	it('should get no posts', done => {
		request1
			.get(uri)
			.expect(res => {
				if (res.body.length !== 0)
					throw new Error("there're posts in mongodb")
			})
			.expect(200, done)
	})
})

describe('Testing restal with pre-handlers and post-handlers', () => {
	// create express app
	const app2 = express()
	app2.use(bodyParser.json())

	// create restal api instance
	const postApis = new Restal(post, uri)
	const token = "123"
	postApis.preHandle('post', (req, res, next) => {
		if (req.headers.authorization === token) next()
		else res.status(400).send({ err: 'wrong token' })
	})
	postApis.postHandle('get', (result, req, res, next) => {
		if (result.length === undefined) result.classification = 'Ooooops!'
		res.status(200).send(result)
	})
	postApis.inject(app2)
	const request2 = supertest(app2)
	it('should clean the mongodb', done => {
		request2
			.delete(uri)
			.expect(200, done)
	})
	it('should get no posts', done => {
		request2
			.get(uri)
			.expect(res => {
				if (res.body.length !== 0)
					throw new Error("there're posts in mongodb")
			})
			.expect(200, done)
	})
	it("shouldn't create a post with wrong token", done => {
		request2
			.post(uri)
			.set('authorization', '321')
			.send({
				title: 'Restal',
				content: "It's pretty awesome!",
				classification: 'Restful'
			})
			.expect(400, done)
	})
	it('should get no posts', done => {
		request2
			.get(uri)
			.expect(res => {
				if (res.body.length !== 0)
					throw new Error("there're posts in mongodb")
			})
			.expect(200, done)
	})
	it('should create a post with right token', done => {
		request2
			.post(uri)
			.set('authorization', '123')
			.send({
				title: 'Restal',
				content: "It's pretty awesome!",
				classification: 'Restful'
			})
			.expect(200, done)
	})
	let id
	it("should get a post with original classification 'Restful'", done => {
		request2
			.get(uri)
			.expect(res => {
				if (res.body.length !== 1)
					throw new Error('there should be only one post')
				const post1 = res.body[0]
				if (post1.title !== 'Restal') throw new Error('wrong title')
				if (post1.content !== "It's pretty awesome!") throw new Error('wrong content')
				if (post1.classification !== 'Restful') throw new Error('wrong classification')
				id = post1._id
			})
			.expect(200, done)
	})
	it("should get a post with new classification 'Ooooops!'", done => {
		request2
			.get(uri)
			.query({ id: id })
			.expect(res => {
				const post1 = res.body
				if (post1.title !== 'Restal') throw new Error('wrong title')
				if (post1.content !== "It's pretty awesome!") throw new Error('wrong content')
				if (post1.classification !== 'Ooooops!') throw new Error('wrong classification')
			})
			.expect(200, done)
	})
	it('should delete all posts', done => {
		request2
			.delete(uri)
			.expect(200, done)
	})
	it('should get no posts', done => {
		request2
			.get(uri)
			.expect(res => {
				if (res.body.length !== 0)
					throw new Error("there're posts in mongodb")
			})
			.expect(200, done)
	})
})