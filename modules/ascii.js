// kiwi/ascii.js - Created January 3rd, 2018

// NPM modules
const chalk = require('chalk');

/**
 * Pretty-print 'sudocrew' in green ascii art
 * http://patorjk.com/software/taag/#p=display&f=Straight&t=sudocrew
 * @returns {Promise<string>} ascii art
 */
module.exports = function() {
	return new Promise(function(resolve) {
		const time = new Date();
		const year = time.getFullYear();
		const ascii = chalk.green('                _\n' +
		'  ___ _   _  __| | ___   ___ _ __ _____      __\n' +
		' / __| | | |/ _` |/ _ \\ / __| \'__/ _ \\ \\ /\\ / /\n' +
		' \\__ \\ |_| | (_| | (_) | (__| | |  __/\\ V  V /\n' +
		' |___/\\__,_|\\__,_|\\___/ \\___|_|  \\___| \\_/\\_/\n') +
		chalk.white(' © sudocrew ' + year + '\n');
		resolve(ascii);
	});
};

/*
                _
  ___ _   _  __| | ___   ___ _ __ _____      __
 / __| | | |/ _` |/ _ \ / __| '__/ _ \ \ /\ / /
 \__ \ |_| | (_| | (_) | (__| | |  __/\ V  V /
 |___/\__,_|\__,_|\___/ \___|_|  \___| \_/\_/
*/
