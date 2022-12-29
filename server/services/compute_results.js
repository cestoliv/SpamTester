const spamassassin = require('./spamassassin')
const rspamd = require('./rspamd')


/* Services score return
 * {
		name, // given in the getScores function
		is_spam,
		score,
		maximum_score,
		required_score,
		errors: [
			{
				error,
				score,
				description,
			}
			...
		]
	}
 */


async function getScores(rawEmail) {

	services = []

	let promises = []
	/* SpamAssassin */
	promises.push(spamassassin.getScore(rawEmail).then(result => {
		if (result.error) return { error: result.error }
		services.push({
			name: 'SpamAssassin',
			...result,
		})
	}))
	/* Rspamd */
	promises.push(rspamd.getScore(rawEmail).then(result => {
		if (result.error) return { error: result.error }
		services.push({
			name: 'Rspamd',
			...result,
		})
	}))
	await Promise.all(promises)

	let maximum_score = 10
	let required_score = 5
	let score = 0
	let is_spam = false

	let scores_sum = 0
	for (const service of services) {
		if (service.is_spam) is_spam = true
		scores_sum += service.score / service.maximum_score * maximum_score
	}
	score = (scores_sum / services.length).toFixed(2)

	console.log(score)

	return {
		score,
		required_score,
		maximum_score,
		is_spam,
		services
	}
}

exports.getScores = getScores
