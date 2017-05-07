var io = require('socket.io-client');
var ss = require('socket.io-stream');
var Logger = require('js-logger');

Transport = module.exports = Class.extend({

	initialize: function(properties) {

		Object.assign(this, properties);
		this.connected = false;
	},
	
	connect: function(callback) {
		
		this.socket = io.connect(this.address, {
			secure: this.secure || false,
			reconnection: true,
			reconnectionDelay: 100,
			reconnectionAttempts: 10
		});
		this.socket.on('connect', function() {
			if (this.connection.credentials) {
				this.socket.emit('authenticate', this.connection.credentials, function(result) {
					if (result && result.value && result.value.authentic) {
						var username = this.connection.credentials.username;
						Logger.get('transport').log('Connected to the broker as "' + username + '".');
					}
					callback(result);
					this.connected = true;
				}.bind(this));
			} else {
				Logger.get('transport').log('Connected to the broker.');
				callback({
					errors: []
				});
				this.connected = true;
			}
		}.bind(this));
		this.socket.on('connect_error', function(error) {
			Logger.get('transport').error('connect_error: ' + error);
			callback(error);
		});
		this.socket = ss(this.socket);
		this.socket.on('receive', function(request, stream) {
			this.connection.receiver.receive(request, stream);
		}.bind(this));
	},
	
	disconnect: function(callback) {
		
		console.log('Transport.disconnect');
		callback();
	}
});
