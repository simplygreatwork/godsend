
var io = require('socket.io-client');
var ss = require('socket.io-stream');
var Class = require('./Class');
var assert = require('./Assertions');

Sender = module.exports = Class.extend({
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
		this.register = new Register();
		this.initializeSendables();
	},
	
	initializeSendables : function() {
		
		this.sendables = [];
		setInterval(function() {
			if (this.connection.transport.connected) {
				if (this.sendables.length > 0) {
					var sendable = this.sendables.shift();
					this.sendNow(sendable);
				}
			}
		}.bind(this), 5);
	},
	
	send : function(sendable) {
		
		assert.sending(sendable);
		this.sendables.push(sendable);
	},
	
	sendNow: function(properties) {
		
		var result = {
			objects: [],
			errors: []
		};
		var streams = {
			main : ss.createStream({
				highWaterMark: 1024,
				objectMode: true,
				allowHalfOpen: true
			}),
			error : ss.createStream({
				highWaterMark: 1024,
				objectMode: true,
				allowHalfOpen: true
			})
		}
		var request = {
			pattern : properties.pattern
		};
		this.connection.getProcess(this.register, request, streams, function(process) {
			streams.main.on('readable', function() {
				var object = streams.main.read();
				if (object && typeof object == 'object') {
					result.objects.push(object);
					if (properties.read) properties.read(object);
				}
			});
			streams.error.on('readable', function() {
				var error = streams.error.read();
				if (error && typeof error == 'object') {
					result.errors.push(error);
					if (properties.error) properties.error(error);
				}
			});
			streams.main.on('end', function() {
				if (properties.receive) properties.receive(result);
			});
			streams.error.on('end', function() {
				if (false && properties.receive) properties.receive(result);
			});
			if (properties.data) {
				var data = properties.data;
				if (!(data instanceof Array)) {
					data = [data];
				}
				data.forEach(function(each) {
					process.write(each);
				}.bind(this));
				process.end();
			} else {
				if (properties.write) properties.write(streams.main);
			}
		}.bind(this));
		this.connection.transport.socket.emit('send', request, streams);
	},
	
	write: function(pattern) {
		
		return this.connection.transport.write(pattern);
	}
});
