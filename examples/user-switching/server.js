var Class = require('../../godsend.js').Class;
var Bus = require('../../godsend.js').Bus;
var Server = require('../shared/server/Server');
var Authorizer = require('../shared/server/Authorizer');
var Credentials = require('../shared/server/Credentials');
var Client = require('./client.js');

Example = Class.extend({

	initialize: function(properties) {

		new Server().start(function() {
			new Authorizer({
				users: this.users
			}).connect(function() {
				new Agent().connect(function() {
					console.log('Everything has been started.');
					new Client({});
				}.bind(this));
			});
		}.bind(this));
	},

	users: {
		'agent': {
			credentials: {
				username: Credentials.get('agent').username,
				passphrase: Credentials.get('agent').passphrase,
			},
			patterns: {
				sendable: [],
				receivable: [{
					topic: 'post-message'
				}]
			}
		},
		'public': {
			credentials: {
				username: Credentials.get('public').username,
				passphrase: ''
			},
			patterns: {
				sendable: [{
					topic: 'authentication',
					action: 'sign-in'
				}],
				receivable: []
			}
		},
		'client': {
			credentials: {
				username: 'client',
				passphrase: 'passphrase-to-hash'
			},
			patterns: {
				sendable: [{
					topic: 'post-message'
				}],
				receivable: []
			}
		}
	}
});

Agent = Class.extend({

	initialize: function(properties) {

		Object.assign(this, properties);
		this.storage = {};
	},

	connect: function(callback) {

		new Bus({
			address: 'http://127.0.0.1:8080/'
		}).connect({
			credentials: {
				username: Credentials.get('agent').username,
				passphrase: Credentials.get('agent').passphrase,
			},
			responded: function(result) {
				this.connection = result.connection;
				this.process();
				callback();
			}.bind(this)
		});
	},

	process: function() {

		this.connection.process({
			id: 'post-message',
			on: function(request) {
				request.accept({
					topic: 'post-message'
				});
			}.bind(this),
			run: function(stream) {
				stream.push({
					message: 'Received the secure message from the client!'
				});
				stream.next();
			}.bind(this)
		});
	}
});

new Example({});
