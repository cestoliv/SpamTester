const net = require('net');

function parseOutput(symbolsRes, reportRes) {
	const symbolsExtract = symbolsRes.match(/Spam: (.+?) ; (.+?) \/ (.+?)\r\n\r\n(.+?)$/m);
	if (!symbolsExtract) return { error: 'Could not parse SpamAssassin symbols' };

	const is_spam = symbolsExtract[1] !== 'False';
	const score = parseFloat(symbolsExtract[2]);
	const required_score = parseFloat(symbolsExtract[3]);
	const symbols = symbolsExtract[4].split(',');

	const maximum_score = 10;

	return {
		is_spam,
		score: maximum_score - score,
		maximum_score,
		required_score: maximum_score - required_score,
		errors: symbols.map((symbol) => {
			const extractErrors = reportRes.match(new RegExp(`^(.+?) ${symbol} +([\\s\\S]+?)(\\n(?!  ))`, 'm'));

			if (!extractErrors) return { error: symbol };
			return {
				error: symbol,
				score: parseFloat(extractErrors[1]) * -1,
				// Remove newlines and duplicate spaces
				description: extractErrors[2].replace(/\n|\r\n/g, ' ').replace(/ +/g, ' '),
			};
		})
	}
}

/*
 * Possible Commands
 * PING, null
 * CHECK, message
 * SYMBOLS, message
 * REPORT, message
 * REPORT_IFSPAM, message
 * PROCESS, message
 * HEADERS, message
 *
 * @return Promise<Object> response, always resolve
 * 		{ error: 'error message' } on error
 * 		{ result: 'spamassassin result message' } on success
 */
let query = function (cmd, message) {
	return new Promise((resolve) => {
		const host = process.env.SA_HOST || 'localhost';
		const port = process.env.SA_PORT || 783;

		const timedoutSecs = 10;
		const protocolVersion = 1.5;

		let responseData = [];
		let stream = net.createConnection(port, host);

		stream.setTimeout(timedoutSecs * 1000, function () {
			return resolve({ error: 'Connection Timed Out' });
		});

		stream.on('error', function (data) {
			return resolve({ error: data.toString() });
		});

		stream.on('connect', function () {
			// Add new line to message if not present
			message += '\r\n';

			// Create Command to Send to spamd
			let command = `${cmd} SPAMC/${protocolVersion}\r\n`
			command += `Content-length: ${Buffer.byteLength(message)}\r\n`;
			command += `\r\n${message}\r\n`;

			stream.write(command);
		});

		stream.on('data', function (data) {
			responseData.push(data.toString());
		});
		stream.on('close', function () {
			return resolve({ result: responseData.join('\r\n') });
		});
	});
};


/*
* Run SpamAssassin and parse it's output
* Unlike the default comportement, the score start at 10 and goes down to 0
*/
function getScore(rawEmail) {
	return new Promise((resolve) => {
		query('SYMBOLS', rawEmail).then((symbolsRes) => {
			if (symbolsRes.error) return resolve(symbolsRes);

			query('REPORT', rawEmail).then((reportRes) => {
				if (reportRes.error) return resolve(reportRes);

				resolve(parseOutput(symbolsRes.result, reportRes.result));
			})
		})
	})
}

exports.getScore = getScore
