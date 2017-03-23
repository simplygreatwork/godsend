var Class = require('../../godsend.js').Class;
var Bus = require('../../godsend.js').Bus;
var exchange = require('../../godsend.js').Exchange;
var Server = require('../shared/server/Server');
var Authorizer = require('../shared/server/Authorizer');
var Credentials = require('../shared/server/Credentials');
var Client = require('./client.js');

Example = Class.extend({

	initialize: function(properties) {

		new Server({
			exchange: new exchange.Secure({
				users: require('../shared/server/users.json')
			})
		}).start(function() {
			new Authorizer({
				users: this.users
			}).connect(function() {
				new Agent().connect(function() {
					new Client({});
					console.log('Everything has been started.');
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
				receivable: []
			}
		},
		'client': {
			credentials: {
				username: Credentials.get('client').username,
				passphrase: Credentials.get('client').passphrase,
			},
			patterns: {
				sendable: [],
				receivable: []
			}
		}
	}
});

Agent = Class.extend({

	initialize: function(properties) {

		Object.assign(this, properties);
	},

	connect: function(callback) {

		this.bus = new Bus({
			address: 'http://127.0.0.1:8080/'
		});
		this.bus.connect({
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
			on: function(request, response) {
				request.accept({
					topic: 'post-message'
				})
			}.bind(this),
			run: function(stream) {
				stream.push({
					message: 'Securely received a message from the client: ' + JSON.stringify(stream.object)
				});
				stream.next();
			}.bind(this)
		});
	}
});

new Example({});
