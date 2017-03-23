var Class = require('./Class');
var io = require('socket.io-client');
var ss = require('socket.io-stream');

Stream = module.exports = Class.extend({

	initialize: function(properties) {

		Object.assign(this, properties);
		this.main = ss.createStream({
			highWaterMark: 1024,
			objectMode: true,
			allowHalfOpen: true
		});
		this.error = ss.createStream({
			highWaterMark: 1024,
			objectMode: true,
			allowHalfOpen: true
		});
	},

	send: function(pattern) {

		this.socket.emit('send', {
			pattern: pattern
		}, {
			main: this.main,
			error: this.error
		});
	},

	write: function(data, callback) {

		this.main.write(data, callback);
	},

	end: function() {

		this.main.end();
	}
});
