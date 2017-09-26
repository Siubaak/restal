const mongoose = require('mongoose')
mongoose.Promise = Promise
mongoose.connect('mongodb://localhost/test', { useMongoClient: true })

const User = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    age: Number,
    address: String
})
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

const user = mongoose.model('user', User)
const post = mongoose.model('post', Post)

module.exports = { user, post }
