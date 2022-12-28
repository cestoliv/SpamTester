const {createMimeMessage} = require('mimetext')

function generateRandomAlphaNumericString(length) {
	let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let string = "";
	for (let i = 0; i < length; i++) {
		string += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return string;
}

browser.tabs.query({
	active: true,
	currentWindow: true,
}).then(tabs => {
	let tabId = tabs[0].id;
	browser.compose.getComposeDetails(tabId).then((details) => {

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
		fetch("http://localhost:3060/score", options)
			.then(res => res.json())
			.then(res => console.log(res))
	});
});
