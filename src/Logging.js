var Logger = require('js-logger');
var Bus = require('./Bus');

module.exports = Class.extend({

	initialize: function(properties) {

		Object.assign(this, properties);
		this.initializeLogger();
		this.initializeHandlers();
		this.remotes = [];
	},

	initializeLogger: function() {

		Logger.useDefaults();
		Logger.setLevel(Logger.INFO);
		Logger.get('broker').setLevel(Logger.INFO);
		Logger.get('exchange').setLevel(Logger.INFO);
		Logger.get('bus').setLevel(Logger.INFO);
		Logger.get('cache').setLevel(Logger.INFO);
		Logger.get('connection').setLevel(Logger.INFO);
		Logger.get('register').setLevel(Logger.INFO);
		Logger.get('request').setLevel(Logger.INFO);
		Logger.get('transport').setLevel(Logger.INFO);
		Logger.get('server').setLevel(Logger.INFO);
		Logger.get('server-web').setLevel(Logger.INFO);
		Logger.get('server-socket').setLevel(Logger.INFO);
	},

	initializeHandlers: function() {

		this.handlers = {
			'default': Logger.createDefaultHandler(),
			'push': this.push.bind(this)
		};
		Logger.setHandler(function(messages, context) {
			this.handlers['default'](messages, context);
			this.handlers['push'](messages, context);
		}.bind(this));
	},

	connect: function(callback) {

		this.bus = new Bus({
			address: 'http://127.0.0.1:8080/'
		});
		this.bus.connect({
			credentials: {
				username: Credentials.get('logger').username,
				passphrase: Credentials.get('logger').passphrase,
			},
			connected: function(connection) {
				this.connection = connection;
				if (callback) callback();
			}.bind(this),
			errored : function(errors) {
				console.error('Connection errors: ' + errors);
				if (callback) callback();
			}.bind(this)
		});
	},

	push: function(messages, context) { // need to restrict named log set : else infinite recursion from exchange logs
		// however developers won't typically have access to the server Logger instance
		if (this.connection && this.remotes.indexOf(context.name) > -1) {
			this.connection.send({
				pattern: {
					topic: 'examples-logging'
				},
				data: {
					messages: messages,
					context: context
				},
				receive: function(result) {
					if (false) console.log(result);
				}.bind(this)
			});
		}
	}
});
