const fastify = require('fastify')({ logger: true })
const cors = require('@fastify/cors')

const spamassassin = require('./services/spamassassin')
const rspamd = require('./services/rspamd')
const { getScores } = require('./services/compute_results')

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

	return await getScores(request.body.raw)
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
