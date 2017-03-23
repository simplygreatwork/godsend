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
				receivable: [{
					topic: 'store',
					action: 'put',
					collection: 'tasks'
				}, {
					topic: 'store',
					action: 'all',
					collection: 'tasks'
				}]
			}
		},
		'client': {
			credentials: {
				username: Credentials.get('client').username,
				passphrase: Credentials.get('client').passphrase,
			},
			patterns: {
				sendable: [{
					topic: 'store',
					action: 'put',
					collection: 'tasks'
				}, {
					topic: 'store',
					action: 'all',
					collection: 'tasks'
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
			id: 'store-all-tasks',
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'all',
					collection: 'tasks'
				});
			}.bind(this),
			run: function(stream) {
				var collection = stream.request.pattern.collection;
				this.storage[collection] = this.storage[collection] || {};
				if (stream.object.fields) {
					Object.keys(this.storage[collection]).forEach(function(key) {
						var each = this.storage[collection][key];
						var object = {};
						Object.keys(stream.object.fields).forEach(function(property) {
							object[property] = each[property];
						}.bind(this));
						stream.push(object);
					}.bind(this));
				} else {
					Object.keys(this.storage[collection]).forEach(function(key) {
						var object = this.storage[collection][key];
						stream.push(object);
					}.bind(this));
				}
				stream.next();
			}.bind(this)
		});

		this.connection.process({
			id: 'store-put',
			cache: false,
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'put'
				});
			}.bind(this),
			run: function(stream) {
				console.log('Putting the task.');
				var collection = stream.request.pattern.collection;
				var key = stream.object.key;
				this.storage[collection] = this.storage[collection] || {};
				this.storage[collection][key] = stream.object.value;
				stream.push(stream.object);
				stream.next();
			}.bind(this)
		});

		this.connection.process({
			id: 'store-put-tasks-validate',
			before: 'store-put',
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'put',
					collection: 'tasks'
				});
			}.bind(this),
			run: function(stream) {
				console.log('Validating the task.');
				if (!stream.object.value.title) {
					stream.err({
						message: 'The task is not valid.'
					});
					stream.next();
				} else {
					stream.push(stream.object);
					stream.next();
				}
			}.bind(this)
		});

		this.connection.process({
			id: 'store-put-tasks-transform',
			before: 'store-put-tasks-validate',
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'put',
					collection: 'tasks'
				});
			}.bind(this),
			run: function(stream) {
				console.log('Transforming the task.');
				if (!stream.object.value.id) stream.object.value.id = stream.object.key;
				if (!stream.object.value.created) stream.object.value.created = new Date();
				stream.object.value.modified = new Date();
				stream.push(stream.object);
				stream.next();
			}.bind(this)
		});
	}
});

new Example({});
