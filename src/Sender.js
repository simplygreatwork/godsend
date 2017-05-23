
var Writable = require('stream').Writable || require('readable-stream').Writable;
var io = require('socket.io-client');
var ss = require('socket.io-stream');
var Class = require('./Class');
var assert = require('./Assertions');

Sender = module.exports = Class.extend({
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
		this.register = {
			outbound : new Register({
				name : 'outbound'
			}),
			inbound : new Register({
				name : 'inbound'
			})
		};
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
		}.bind(this), 1);
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
		var request = {
			pattern : properties.pattern
		};
		if (this.connection.credentials) {
			request.username = this.connection.credentials.username;
		}
		var streams = this.createStreams();
		streams.inbound.main._write = function(chunk, encoding, done) {
			result.objects.push(chunk);
			if (properties.read) properties.read(chunk);
			done();
		};
		streams.inbound.main.on('finish', function(data) {
			if (properties.receive) properties.receive(result);
		});
		streams.inbound.error._write = function(chunk, encoding, done) {
			result.errors.push(chunk);
			if (properties.error) properties.error(chunk);
			done();
		};
		streams.inbound.error.on('finish', function(data) {
			if (false && properties.receive) properties.receive(result);
		});
		this.connection.getProcess(this.register.outbound, request, streams.outbound, function(outbound) {
			this.connection.getProcess(this.register.inbound, request, streams.inbound, function(inbound) {
				streams.outbound.main.on('readable', function() {
					var object = streams.outbound.main.read();
					if (object && typeof object == 'object') {
						inbound.write(object);
					}
				});
				streams.outbound.error.on('readable', function() {
					var error = streams.outbound.error.read();
					if (error) {
						if (true) {
							streams.inbound.error.write(error);
						} else {
							inbound.err(error);			// throws write error
						}
					}
				});
				streams.outbound.main.on('end', function() {
					inbound.end();
				});
				streams.outbound.error.on('end', function() {
					if (false) streams.inbound.error.end();
				});
				if (properties.write) {
					properties.write(streams.outbound.main)
				} else {
					var data = properties.data;
					if (! data) {
						data = {};
					}
					if (!(data instanceof Array)) {
						data = [data];
					}
					data.forEach(function(each) {
						outbound.write(each);
					}.bind(this));
					outbound.end();
				}
			}.bind(this));
		}.bind(this));
		this.connection.transport.socket.emit('send', request, streams.outbound);
	},
	
	createStreams : function() {
		
		return {
			outbound : {
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
			},
			inbound : {
				main : new Writable({
					highWaterMark: 1024,
					objectMode: true,
					allowHalfOpen: true
				}),
				error : new Writable({
					highWaterMark: 1024,
					objectMode: true,
					allowHalfOpen: true
				})
			}
		};
	}
});
