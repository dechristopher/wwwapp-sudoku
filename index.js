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
const cookieParser = require('cookie-parser');
const hasher = require('password-hash-and-salt');

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

// DB Connection
let dbc;

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
	secret: conf.secret,
	cookie: {},
};

// Ensure requests time out after 2 seconds
app.use(timeout.handler(timeoutOptions));

// Parse user cookies
app.use(cookieParser());

// Use the session middleware
app.use(session(sess));

// Inject bodyParser middleware to get request body
// to support JSON-encoded bodies
app.use(bodyParser.json());
// to support URL-encoded bodies
app.use(bodyParser.urlencoded({
	extended: true,
}));

// Serve HTML resources statically
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

// Run the learn page template
app.get('/learn', (req, res) => {
	// TODO
	log(`[GET /] ( ${req.ip} )`);
	if (req.session.username) {
		// Run logged-in home template
		res.sendFile(path.join(__dirname + '/templates/learn_sudoku.html'));
	}
	else {
		// Run standard home template
		res.sendFile(path.join(__dirname + '/templates/learn_sudoku.html'));
	}
});

// Run the learn page template
app.get('/leaderboard', (req, res) => {
	// TODO
	log(`[GET /] ( ${req.ip} )`);
	if (req.session.username) {
		// Run logged-in home template
		res.sendFile(path.join(__dirname + '/templates/leaderboard.html'));
	}
	else {
		// Run standard home template
		res.sendFile(path.join(__dirname + '/templates/leaderboard.html'));
	}
});

// Log in and redirect to home
app.post('/login', (req, res) => {
	// Ensure all credentials are provided
	if(!req.body.username) {
		log('no username');
		res.sendStatus(400);
		return;
	}
	if(!req.body.psw) {
		log('no password');
		res.sendStatus(400);
		return;
	}

	// DO DB hit and verify credentials
	dbc.query('SELECT `username` FROM `user` WHERE `username` = ?', [req.body.username], function(error, results) {
		if (error) {
			log(`[GET USER EXISTS ERROR] ${error}`);
			return;
		}

		if(!results.length) {
			log(`[POST /login] (LOGIN FAIL [user nonexistant] ${req.body.username}) ( ${req.ip} )`);
			res.redirect('/?e=badLogin');
			return;
		}

		verifyPassword(req.body.username, req.body.psw).then(validated => {
			if(!validated) {
				log(`[POST /login] (LOGIN FAIL [bad password] ${req.body.username}) ( ${req.ip} )`);
				res.redirect('/?e=badLogin');
				return;
			}
			req.session.username = req.body.username;
			res.cookie('sid', req.session.id);
			res.cookie('username', req.session.username);
			log(`[POST /login] (LOGIN ${req.body.username}) ( ${req.ip} )`);
			res.redirect('/');
		});
	});
});


app.post('/register', (req, res) => {
	log();
	res.redirect('/');

	// TODO REGISTER
});

// Log out and redirect to home
app.get('/logout', (req, res) => {
	log(`[GET /logout] (LOGOUT ${req.session.username}) (${req.ip})`);
	res.clearCookie('sid');
	res.clearCookie('username');
	req.session.destroy(function(err) {
		if(err) {
			log(`Session destruction error => ${err}`);
			res.sendStatus(500);
		}
		// Redirect to home
		res.redirect('/');
	});
});

// AJAX, no user redirection or HTML parsing needed
app.post('/solve', (req, res) => {
	const userID = req.cookies.userID;
	const time = req.body.time;
	const difficulty = req.body.difficulty;
	const seed = req.body.seed;
	log(`[POST /solve] (USERNAME: ${req.session.username}, UID: ${userID}, SOLVED IN: ${time}sec, DIFF:${difficulty}) (${req.ip})`);
	// Post times to DB
	dbc.query('INSERT INTO `solves` (user_id, time, seed, difficulty_id) VALUES (?, ?, ?, ?)', [userID, time, seed, difficulty], function(error) {
		if(error) {
			log(`[POST SOLVE ERROR] ${error}`);
			res.sendStatus(500);
			return;
		}
		res.sendStatus(200);
	});
});

/**
 * Generates a crpytographically secure hash with BCrypt and salts it properly
 * @param {string} secret the password to hash
 * @returns {Promise<string>} the hash
 */
function genHash(secret) {
	return new Promise(function(resolve, reject) {
		hasher(secret).hash(function(error, hash) {
			if (error) {
				reject();
				throw new Error('Something went wrong!');
			}
			resolve(hash);
		});
	});
}
/**
 * Verifies that a given secret matches the stored hash for user auth
 * @param {*} username the user's username
 * @param {*} secret the user's password
 * @returns {Promise<boolean>} validated or not
 */
function verifyPassword(username, secret) {
	return new Promise(function(resolve) {
		dbc.query('SELECT `password` FROM `user` WHERE `username` = ?', [username], function(error, results) {
			if (error) {
				log(`[GET PASSWORD HASH ERROR] ${error}`);
				return;
			}

			hasher(secret).verifyAgainst('p' + results[0].password, function(errorV, verified) {
				if (errorV) {
					resolve(false);
					throw new Error(`[VERIFY PASSWORD HASH ERROR] ${errorV}`);
				}
				if (!verified) {
					resolve(false);
				}
				resolve(true);
			});
		});
	});
}

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
				dbc.destroy();
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
	dbc = new (require('./modules/services/dbc'))(conf.db).conn();
	// genHash('memes').then(console.log);
});

