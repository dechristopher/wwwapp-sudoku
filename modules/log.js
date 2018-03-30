// kiwi/log.js - Created on on September 1st, 2016

// NPM modules
const c = require('chalk');
const datetime = require('node-datetime');

// Core Node Modules
const fs = require('fs');
const os = require('os');

// Static variables
const hostname = os.hostname();
const LOG = `[${c.green('sudocrew')} ~ ${hostname}]`;

/* Wraps console.log for printing pretty logging to stdout and to a file
    message: (string) message to log
    options: (object) logging configuration options
        Format:
        {
            logName: 'name of sub-log file' (default: none/undefined (global file log)) [appends to log file name XX-XX-XX-name.log]
            stdOut: 'whether or not to print log to console' (default: true)
            usePrefix: 'whether or not to use the timestamp/serviceName log prefix in output' (default: true)
            newLinePre: 'prepends a newline onto a line such that it is separated from previous lines in the log' (default: false)
        }
*/
module.exports = function(message, options = { logName: '', stdOut: true, usePrefix: true, newLinePre: false, debug: false }) {
	// Force defaults (silly node backwards compatibility)
	options.logName = (options.logName === undefined ? '' : options.logName);
	options.stdOut = (options.stdOut === undefined ? true : options.stdOut);
	options.usePrefix = (options.usePrefix === undefined ? true : options.usePrefix);
	options.newLinePre = (options.newLinePre === undefined ? false : options.newLinePre);
	options.debug = (options.debug === undefined ? false : options.debug);

	// Show all option values if options.debug set to true
	if (options.debug) {
		console.log(`logName: '${options.logName}', stdOut: '${options.stdOut}', usePrefix: '${options.usePrefix}', newLinePre: '${options.newLinePre}', debug: '${options.debug}'`);
	}

	// Define date formats for current function call
	const time = datetime.create().format('H:M:S');
	const today = datetime.create().format('m-d-y');

	// Variable that includes time and logging prefix
	const prefix = `[${time}] ${LOG}`;
	const filePrefix = `[${time}] [${hostname}]`;

	// Default filename
	let file = `logs/${today}.log`;
	// Default line format
	let line = `${prefix} ${message}`;
	let fileLine = `${filePrefix} ${message}${os.EOL}`;

	// Handle logname argument
	if (options.logName !== undefined && options.logName !== '') {
		file = `logs/${today}-${options.logName}.log`;
		line = `${prefix} [${options.logName}] ${message}`;
	}

	if (!options.usePrefix) {
		line = `${message}`;
		fileLine = `${message}`;
	}

	if (options.newLinePre) {
		line = `${os.EOL}` + line;
		fileLine = `${os.EOL}` + fileLine;
	}

	// Handle consoleOut argument
	if (options.stdOut !== false) {
		console.log(line);
	}

	// Strip color codes from logs
	// line = stripColors(line);

	// Build strings
	const strBeginLog = `BEGIN RELVA LOG FOR ${today}${os.EOL}`;
	const strCreatedLog = `${prefix} Created new log >> ${file}`;
	const strLogCreationFailed = `${prefix} LOG FILE CREATION FAILED AT ${time} FOR FILE: ${file}`;
	const strFileLoggingFailed = `${prefix} FILE LOGGING FAILED AT ${time} FOR MSG: ${fileLine}`;

	return new Promise(function(resolve, reject) {
		// Begin log file ops
		fs.exists(file, function(exists) {
			if (exists) {
				// Write log entry
				fs.appendFile(file, fileLine, function(err) {
					if (err) {
						console.log(strFileLoggingFailed);
						reject(err);
					}
					resolve();
				});
			}
			else {
				// Create the file
				fs.writeFile(file, strBeginLog, function(err) {
					if (err) {
						console.log(strLogCreationFailed);
						reject(err);
					}
					console.log(strCreatedLog);
				});
				// Write log entry
				fs.appendFile(file, fileLine, function(err) {
					if (err) {
						console.log(strFileLoggingFailed);
						reject(err);
					}
					resolve();
				});
			}
		});
	});
};

/* // Bash color codes
const colorCodes = [
	'[30m', '[31m', '[32m', '[33m', '[34m', '[35m', '[36m', '[37m', '[38m', '[39m',
];

// Strips bash color codes from an input line
const stripColors = function(line) {
	colorCodes.forEach(function(code) {
		line.replace(code, '');
	});
	return line;
}; */
