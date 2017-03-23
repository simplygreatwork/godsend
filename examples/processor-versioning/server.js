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
					topic: 'store',
					action: 'get'
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
					action: 'get',
					collection: 'tasks'
				}],
				receivable: []
			},
			versions: {
				'store-get-tasks-transform': ' unversioned '
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
			id: 'store-get',
			cache: false,
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'get',
					collection: 'tasks'
				});
			}.bind(this),
			run: function(stream) {
				console.log('Getting the task.');
				stream.push({
					title: 'Untitled Task',
					done: false
				});
				stream.next();
			}.bind(this)
		});

		this.connection.process({
			id: 'store-get-tasks-transform',
			after: 'store-get',
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'get',
					collection: 'tasks'
				});
			}.bind(this),
			run: function(stream) {
				console.log('Transforming the task. (unversioned)');
				stream.push(stream.object);
				stream.next();
			}.bind(this)
		});

		this.connection.process({
			id: 'store-get-tasks-transform',
			version: {
				name: 'version-two',
				'default': true
			},
			after: 'store-get',
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'get',
					collection: 'tasks'
				});
			}.bind(this),
			run: function(stream) {
				console.log('Transforming the task. (v2 : default)');
				stream.push(stream.object);
				stream.next();
			}.bind(this)
		});

		this.connection.process({
			id: 'store-get-tasks-transform',
			version: 'version-three',
			after: 'store-get',
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'get',
					collection: 'tasks'
				});
			}.bind(this),
			run: function(stream) {
				console.log('Transforming the task. (v3)');
				stream.push(stream.object);
				stream.next();
			}.bind(this)
		});
	}
});

new Example({});
