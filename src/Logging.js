var Logger = require('js-logger');
var Bus = require('./Bus');

module.exports = Class.extend({
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
		this.initializeLogger();
		if (false) this.initializeHandlers();
		this.remotes = [];
	},
	
	initializeLogger: function() {
		
		Logger.useDefaults();
		Logger.setLevel(Logger.INFO);
		this.initializeInternalLevels(Logger.INFO);
		this.initializeInternalLevels(Logger.OFF);
		Logger.get('exchange-secure').setLevel(Logger.OFF);
		Logger.get('exchange-learning').setLevel(Logger.OFF);
	},
	
	initializeInternalLevels : function(level) {
		
		Logger.get('broker').setLevel(level);
		Logger.get('exchange').setLevel(level);
		Logger.get('bus').setLevel(level);
		Logger.get('cache').setLevel(level);
		Logger.get('connection').setLevel(level);
		Logger.get('register').setLevel(level);
		Logger.get('request').setLevel(level);
		Logger.get('transport').setLevel(level);
		Logger.get('server').setLevel(level);
		Logger.get('server-web').setLevel(level);
		Logger.get('server-socket').setLevel(level);
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
		
		new Bus({
			address: this.address || 'http://127.0.0.1:' + (process.env.PORT || 8080) + '/'
		}).connect({
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
