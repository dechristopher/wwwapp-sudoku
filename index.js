// wwwapp-sudoku/index.js - Created March 1st, 2018

/*
GOODLUCK
TRIFORCE
   ▲
 ▲  ▲
PRAY FOR
NO CRASH
*/

// NPM Modules
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();
const https = require('https');
const timeout = require('express-timeout-handler');

// Core Node Modules
const fs = require('fs');
const os = require('os');
const path = require('path');

// Custom Modules
const log = require('./modules/log');
const ascii = require('./modules/ascii');

// Build configuration
const conf = JSON.parse(fs.readFileSync('./config.json'));
const version = require('./package').version;

// Static strings
const strServiceInit = `Init SUDOCREW | v${version} | *:${conf.port} | SSL: ${conf.ssl.enabled}`;
const strServiceUp = `Service up. Listening on *:${conf.port}`;
const strServiceUnavailable = 'Service unavailable. Please retry later. If this error persists, contact an engineer.';
const strForceShutdown = 'Could not close connections in time, forcefully shutting down!';
const strInitShutdown = 'Init service shutdown';

// HTTP server variable
let srv;

// Set up timeout middleware options
const timeoutOptions = {
	timeout: conf.timeout,
	onTimeout: function(req, res) {
		req.timedout = true;
		res.status(503).send(strServiceUnavailable);
	},
	onDelayedResponse: function(req, method, args, requestTime) {
		console.log(`Attempted to call ${method} after timeout: ~${requestTime}ms`);
	},
	disable: ['write', 'setHeaders', 'send', 'json', 'end'],
};

// Set up session options
const sess = {
	secret: conf.authToken,
	cookie: {},
};

// Ensure requests time out after 2 seconds
app.use(timeout.handler(timeoutOptions));

// Use the session middleware
app.use(session(sess));

// Inject bodyParser middleware to get request body
// to support JSON-encoded bodies
app.use(bodyParser.json());
// to support URL-encoded bodies
app.use(bodyParser.urlencoded({
	extended: true,
}));

app.use(express.static('templates/assets'));

// Run the homepage template
app.get('/', (req, res) => {
	// TODO
	log(`[GET /] ( ${req.ip} )`);
	if(req.session.username) {
		// Run logged-in home template
		res.sendFile(path.join(__dirname + '/templates/index.html'));
	}
	else {
		// Run standard home template
		res.sendFile(path.join(__dirname + '/templates/index.html'));
	}
});

// Log in and redirect to home
app.post('/login', (req, res) => {
	// TODO
	let success;
	// DO DB hit and verify credentials
	req.session.username = req.body.username;
	log(`[POST /login] (LOGIN ${req.body.username} [${success}]) ( ${req.ip} )`);
	res.redirect('/');
});

// Log out and redirect to home
app.get('/logout', (req, res) => {
	req.session.destroy(function(err) {
		if(err) {
			log(`Session destruction error => ${err}`);
			res.sendStatus(500);
		}
		// Redirect to home
		log(`[GET /logout] (LOGOUT ${req.session.username}) (${req.ip})`);
		res.redirect('/');
	});
});

// AJAX, no user redirection or HTML parsing needed
app.post('/solve', (req, res) => {
	// Post times to DB
	res.sendStatus(200);
});

function init() {
	// SSL Mode Logic
	if (conf.ssl.enabled) {
	// Set HTTP prefix
		conf.ssl.prefix = 'https';
		// Configure SSL
		const options = {
			key: fs.readFileSync(conf.ssl.pKeyFile),
			cert: fs.readFileSync(conf.ssl.certFile),
		};
		// Listen for requests
		srv = https.createServer(options, app).listen(conf.port, () => { log(strServiceUp); });
		srv.timeout = conf.timeout;
	}
	else {
	// Set HTTP prefix
		conf.ssl.prefix = 'http';
		// No SSL
		srv = app.listen(conf.port, () => { log(strServiceUp); });
		srv.timeout = conf.timeout;
	}
}

// Initiate shutdown procedures
function terminate() {
	// Hard quit if service cannot gracefully shutdown after 10 seconds
	setTimeout(function() {
		log(strForceShutdown, { newLinePre: true }).then(() => {
			log(`${os.EOL}~${os.EOL}${os.EOL}`, { stdOut: false, usePrefix: false }).then(() => {
				// Terminate with exit code 1
				process.exit(1);
			});
		});
	}, 10 * 1000);
	// Attempt a graceful shutdown on SIGTERM
	srv.close(function() {
		log(strInitShutdown, { newLinePre: true }).then(() => {
			log(`${os.EOL}~${os.EOL}${os.EOL}`, { stdOut: false, usePrefix: false }).then(() => {
				// Close db, cache connections, etc...
				// Terminate with exit code 0
				process.exit(0);
			});
		});
	});
}

// Catch the termination signal and operate on it
process.on('SIGTERM', function() {
	terminate();
});

// Catch the interrupt signal and operate on it
process.on('SIGINT', function() {
	terminate();
});

// Print startup information
ascii().then(console.log).then(() => {
	log(strServiceInit);
	init();
});

