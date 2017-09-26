class REST {
    // Constructor
    /**
     * Create a restal api instance
     * @param {Object} model mongoose model
     * @param {string} uri resource uri
     */
    constructor (model, uri) {
        this._model = model
        this._uri = uri
        this._actions = { get: [], post: [], put: [], patch: [], delete: [] }
        this._hasNext = { get: false, post: false, put: false, patch: false, delete: false }
        this._generate()
    }
    // Private methods
    _generate () {
        for (const method in this._actions) {
            this._actions[method] = [this['_' + method].bind(this)]
        }
    }
    async _get (req, res, next) {
        let { id, cond, skip = 0, num = 0 } = req.query
        let result
        if (id) {
            try {
                result = await this._model.findById(id)
            } catch (err) {
                return res.status(400).send({ err: err.message || 'wrong params' })
            }
        } else {
            if (cond) {
                try {
                    cond = JSON.parse(cond)
                } catch (err) {
                    return res.status(400).send({ err: 'fail to parse condition json' })
                }
            }
            try {
                result = await this._model.find(cond).skip(Number(skip)).limit(Number(num))
            } catch (err) {
                return es.status(400).send({ err: err.message || 'wrong params' })
            }
        }
        if (this._hasNext.get) next(result)
        else res.status(200).send(result)
    }
    async _post (req, res, next) {
        const modelObj = req.body
        let result
        try {
            result = await this._model.create(modelObj)
        } catch (err) {
            return res.status(400).send({ err: err.message || 'wrong params' })
        }
        if (this._hasNext.post) next(result._id)
        else res.status(200).send({ result: 'success', id: result._id })
    }
    async _put (req, res, next) {
        const { id } = req.query
        if (!id) return res.status(400).send({ err: 'missing id' })
        let result
        try {
            result = await this._model.remove({ _id: id })
            if (result.result.n) {
                const modelObj = req.body
                modelObj._id = id
                await this._model.create(modelObj)
            }
        } catch (err) {
            return res.status(400).send({ err: err.message || 'wrong params' })
        }
        if (this._hasNext.put) next(id)
        else if (result.result.n) res.status(200).send({ result: 'success', id })
        else res.status(400).send({ err: 'no id-matched document' })
    }
    async _patch (req, res, next) {
        const { id } = req.query
        if (!id) return res.status(400).send({ err: 'missing id' })
        const modelObj = req.body
        let result
        try {
            result = await this._model.update({ _id: id }, { $set: modelObj })
        } catch (err) {
            return res.status(400).send({ err: err.message || 'wrong params' })
        }
        if (this._hasNext.patch) next(id)
        else if (result.n) res.status(200).send({ result: 'success', id })
        else res.status(400).send({ err: 'no id-matched document' })
    }
    async _delete (req, res, next) {
        const { id, cond } = req.query
        let result
        if (id) {
            try {
                result = await this._model.remove({ _id: id })
            } catch (err) {
                return res.status(400).send({ err: err.message || 'wrong params' })
            }
        } else {
            if (cond) {
                try {
                    cond = JSON.parse(cond)
                } catch (err) {
                    return res.status(400).send({ err: 'fail to parse condition json' })
                }
            }
            try {
                result = await this._model.remove(cond)
            } catch (err) {
                return res.status(400).send({ err: err.message || 'wrong params' })
            }
        }
        if (this._hasNext.delete) next(id)
        else if (result.result.n) res.status(200).send({ result: 'success', id })
        else res.status(400).send({ err: 'no id-matched document' })
    }
    // Public fields and methods
    get uri () { return this._uri }
    get model () { return this._model }
    /**
     * Add middleware(s) to pre-hanlde or intercept the request
     * @param {string} method HTTP method
     * @param {function} handler pre handler function
     */
    preHandle (method, handler) {
        method = method.toLowerCase()
        this._actions[method].unshfit(handler)
    }
    /**
     * Add middleware to post-handle the result
     * @param {string} method HTTP method
     * @param {function} handler post handler function
     */
    postHandle (method, handler) {
        method = method.toLowerCase()
        this._hasNext[method] = true
        this._actions[method].push(handler)
    }
    /**
     * Inject the apis into the express app
     * @param {Object} app express app
     */
    inject (app) {
        for (const method in this._actions) {
            app[method](this.uri, ...this._actions[method])
        }
    }
}

module.exports = REST
