function parseOutput(output) {
	output = output.default

	let notErrorsKey = ['is_spam', 'is_skipped', 'score', 'required_score', 'action']

	return {
		is_spam: output.is_spam,
		score: output.score,
		maximum_score: 15,
		required_score: output.required_score,
		errors: Object.keys(output).filter(key => !notErrorsKey.includes(key)).map(key => {
			return {
				error: output[key].name,
				score: output[key].score,
				description: output[key].description,
			}
		})
	}
}

/*
* Run Rspamd and parse it's output
*/
function getScore(rawEmail) {
	return new Promise((resolve) => {
		const host = process.env.RSPAMD_HOST || 'localhost';
		const port = process.env.RSPAMD_PORT || 11333;
		const path = '/check';

		fetch(`http://${host}:${port}${path}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'text/plain',
			},
			body: rawEmail,
		}).then((res) => {
			res.json().then((data) => {
				resolve(parseOutput(data));
			}).catch((err) => {
				resolve({ error: err.toString() });
			})
		}).catch((err) => {
			resolve({ error: err.toString() });
		})
	})
}

exports.getScore = getScore
