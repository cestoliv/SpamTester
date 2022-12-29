const {createMimeMessage} = require('mimetext')

function generateRandomAlphaNumericString(length) {
	let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let string = "";
	for (let i = 0; i < length; i++) {
		string += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return string;
}

async function retrieveScore() {
	const tabs = await browser.tabs.query({
		active: true,
		currentWindow: true,
	})
	const tabId = tabs[0].id;
	const details = await browser.compose.getComposeDetails(tabId)

	const msg = createMimeMessage()
	if (details.from) msg.setSender(details.from)
	if (details.to.length)
		msg.setTo(details.to)
	else
		msg.setTo(details.from)
	if (details.cc.length) msg.setCc(details.cc)
	if (details.bcc.length) msg.setBcc(details.bcc)
	if (details.subject) msg.setSubject(details.subject)
	if (details.plainTextBody) msg.setMessage('text/plain', details.plainTextBody)

	if (!details.isPlainText && details.body) {
		// Replace base64 images with their cid
		let base64Regex = /src="data:(image\/.+?);base64,(.+?)"/
		let match = details.body.match(base64Regex)
		while (match) {
			const cid = generateRandomAlphaNumericString(10)
			const filename = `${cid}.${match[1].split('/')[1]}`

			msg.setAttachment(filename, match[1], match[0], { 'Content-ID': cid })

			details.body = details.body.replace(match[0], `src="cid:${cid}"`)
			match = details.body.match(base64Regex)
		}

		msg.setMessage('text/html', details.body)
	}

	// request options
	const options = {
		method: 'POST',
		body: JSON.stringify({raw: msg.asRaw()}),
		headers: {
			'Content-Type': 'application/json'
		}
	}

	// send POST request
	var instance_url = (await browser.storage.sync.get("server")).server
	if (!instance_url) instance_url = "https://spamassassin.chevro.fr"
	return await fetch(`${instance_url}/score`, options)
		.then(res => res.json())
		.then(res => res)
		.catch(err => {
			console.error('Error while fetching score to ' + instance_url)
			throw err
		})
}

// Async main
(async () => {
	let score = { score: -1, is_spam: true }
	try {
		score = await retrieveScore()
	}
	catch (e) {
		// TODO: Display error
		console.error(e)
		return
	}

	if (score.error) {
		// TODO: Display error
		console.error(score.error)
		return
	}

	// Hide loading box
	HTML_loading_box.style.display = 'none'
	// Show score box
	HTML_score_box.style.display = 'flex'
	// Show "show details" button
	HTML_show_details.style.display = 'flex'

	// Display score
	HTML_score.innerHTML = `<bold>${score.score}</bold> / 10`
	HTML_score.classList.add(getScoreClass(score.score, score.required_score, score.maximum_score))

	// Display message
	if (score.is_spam) HTML_message.innerText = 'Your email may be categorized as spam'
	else HTML_message.innerText = 'Your email will not be categorized as spam'

	// Append details
	let services = ['spamassassin']
	services.forEach(serviceName => {
		const service = score[serviceName]

		let errors_html = '<table>'
		for (let error of service.errors) {
			errors_html += `<tr><td>${error.score}</td><td>${error.error}</td><td>${error.description}</td></tr>`
		}
		errors_html += '</table>'


		let details = document.createElement('div')
		details.classList.add('details')
		details.innerHTML = `
			<div class="score-box">
				<span class="score ${getScoreClass(service.score, service.required_score, service.maximum_score)}"><bold>${service.score}</bold> / ${service.maximum_score}</span>
				<span class="name">${serviceName}</span>
			</div>
			<div class="errors">
				${errors_html}
			</div>
			`
		HTML_details_box.appendChild(details)
	})
})()

const HTML_loading_box = document.getElementById('loading-box')
const HTML_score_box = document.getElementById('score-box')
const HTML_content = document.getElementById('content')
const HTML_details_box = document.getElementById('details-box')
const HTML_show_details = document.getElementById('show-details')
const HTML_score = document.getElementById('score')
const HTML_message = document.getElementById('message')

HTML_show_details.addEventListener('click', () => {
	HTML_details_box.classList.toggle('expanded')
	HTML_show_details.classList.toggle('expanded')
})

function getScoreClass(score, required_score, maximum_score) {
	// Return good if the score is higher than 80% of the maximum score
	if (score > maximum_score * (80/100) && score > required_score) return 'good'
	// Return ok if the score is higher than the required score
	if (score > required_score) return 'ok'
	// Return bad if the score is lower than the required score
	return 'bad'
}
