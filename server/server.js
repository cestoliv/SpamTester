const fastify = require('fastify')({ logger: true })
const cors = require('@fastify/cors')

const spamassassin = require('./services/spamassassin')

fastify.register(cors, {
	origin: true,
	methods: ['GET', 'POST'],
})

// Routes
fastify.get('/', async (request, reply) => {
	return { hello: 'world' }
})

fastify.post('/score', async (request, reply) => {
	if (!request.body.raw) return { error: 'No raw email provided' }

	const spamassassinResult = await spamassassin.getScore(request.body.raw)

	return {
		score: spamassassinResult.score,
		required_score: spamassassinResult.required_score,
		maximum_score: spamassassinResult.maximum_score,
		is_spam: spamassassinResult.is_spam,
		spamassassin: spamassassinResult
	}
})

// Run the server!
const start = async () => {
	try {
		await fastify.listen({ port: process.env.PORT || 3060, host: '::' })
	} catch (err) {
		fastify.log.error(err)
		process.exit(1)
	}
}
start()
