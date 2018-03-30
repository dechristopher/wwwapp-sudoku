// kiwi/relva/modules/db.js - Created February 6th, 2018

// NPM Modules
const mysql = require('mysql');
// https://github.com/mysqljs/mysql

// Custom Modules
const log = require('../log');

class DatabaseConnection {
	/**
     * Builds a databse connection
     * @param {Object} options connection options
     * @param {string} options.host db host to connect to
     * @param {int} options.port db port to connect to
     * @param {string} options.user db auth username
     * @param {string} options.password db auth password
     * @param {string} options.database database to use
     */
	constructor(options) {
		this.connection = mysql.createConnection(options);

		this.connection.connect(function(err) {
			if (err) {
				log(`[db] Connection Error -> \n${err.stack}`);
				process.exit(1);
			}

			log('[db] Connection established');
		});
	}

	conn() {
		return this.connection;
	}
}

module.exports = DatabaseConnection;