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
				sendable: [{
					topic: 'store',
					action: 'put-notify',
				}],
				receivable: [{
					topic: 'store',
					action: 'put'
				}]
			}
		},
		'sender': {
			credentials: {
				username: Credentials.get('sender').username,
				passphrase: Credentials.get('sender').passphrase,
			},
			patterns: {
				sendable: [{
					topic: 'store',
					action: 'put',
					collection: 'tasks'
				}, {
					topic: 'store',
					action: 'put',
					collection: 'patients'
				}],
				receivable: []
			}
		},
		'task-receiver': {
			credentials: {
				username: Credentials.get('task-receiver').username,
				passphrase: Credentials.get('task-receiver').passphrase,
			},
			patterns: {
				sendable: [],
				receivable: [{
					topic: 'store',
					action: 'put-notify',
					collection: 'tasks'
				}]
			}
		},
		'patient-receiver': {
			credentials: {
				username: Credentials.get('patient-receiver').username,
				passphrase: Credentials.get('patient-receiver').passphrase,
			},
			patterns: {
				sendable: [],
				receivable: [{
					topic: 'store',
					action: 'put-notify',
					collection: 'patients'
				}]
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
			id: 'store-put',
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'put'
				});
			}.bind(this),
			run: function(stream) {
				console.log('Putting an object.');
				var collection = stream.request.pattern.collection;
				var key = stream.object.key;
				this.storage[collection] = this.storage[collection] || {};
				this.storage[collection][key] = stream.object.value;
				stream.push(stream.object);
				stream.next();
			}.bind(this)
		});

		this.connection.process({
			id: 'store-put-notify',
			after: 'store-put',
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'put'
				});
			}.bind(this),
			run: function(stream) {
				this.connection.send({
					pattern: {
						topic: 'store',
						action: 'put-notify',
						collection: stream.request.pattern.collection
					},
					data: stream.object,
					receive: function(result) {
						stream.push(stream.object);
						stream.next();
					}.bind(this)
				});
			}.bind(this)
		});
	}
});

new Example({});
