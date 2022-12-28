const { spawn } = require('child_process');

function parseOutput(output) {
	const extracted = output.match(/X-Spam-Status: (.+?), score=(.+?) required=(.+?) tests=([\s\S]+?) autolearn/);
	if (!extracted) return { error: 'Could not parse SpamAssassin output' };
	let [_, status, score, required, tests] = extracted;

	// Remove newlines, spaces and tabs from tests
	tests = tests.replace(/\n|\r\n|\t| /g, '');

	return {
		is_spam: status === 'Yes',
		score: 10 - parseFloat(score),
		maximum_score: 10,
		required_score: parseFloat(required),
		errors: tests.split(',').map((test) => {
			const extractErrors = output.match(new RegExp(`^(.+?) ${test} +([\\s\\S]+?)(\\n(?!  ))`, 'm'));

			if (!extractErrors) return { error: test };
			return {
				error: test,
				score: parseFloat(extractErrors[1]) * -1,
				// Remove newlines and duplicate spaces
				description: extractErrors[2].replace(/\n|\r\n/g, ' ').replace(/ +/g, ' '),
			};
		})
	}
}

/*
* Run SpamAssassin and parse it's output
* Unlike the default comportement, the score start at 10 and goes down to 0
*/
function getScore(rawEmail) {
	let saPath = 'spamassassin';
	if (process.env.SA_PATH) saPath = process.env.SA_PATH;

	return new Promise((resolve) => {
		const saProcess = spawn(saPath, ['-t']);

		let saOutput = '';
		saProcess.stdout.on('data', (data) => {
			saOutput += data.toString();
		});
		saProcess.on('exit', (code) => {
			if (code !== 0) resolve({ error: 'SpamAssassin exited with code ' + code });

			resolve(parseOutput(saOutput));
		});

		saProcess.stderr.on('data', (data) => {
			resolve({ error: data.toString() });
		});

		saProcess.stdin.write(rawEmail);
		saProcess.stdin.end();
	})
}

exports.getScore = getScore
