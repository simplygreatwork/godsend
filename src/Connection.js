var io = require('socket.io-client');
var ss = require('socket.io-stream');
var Class = require('./Class');
var Stream = require('./Stream');
var Transport = require('./Transport');
var Register = require('./Register');
var Cache = require('./Cache');
var Process = require('./Process');
var Request = require('./Request');
var Response = require('./Response');

Connection = module.exports = Class.extend({

	initialize: function(properties) {

		Object.assign(this, properties);
		this.register = new Register();
		this.cache = new Cache();
		this.initializeTransport();
	},

	initializeTransport: function() {

		this.transport = new Transport({
			connection: this,
			address: this.address,
			secure: this.secure,
		});
	},

	connect: function(callback) {

		this.transport.connect(callback);
	},

	disconnect: function(callback) {

		this.transport.disconnect(callback);
	},

	write: function(pattern) {

		return this.transport.write(pattern);
	},

	send: function(properties) {
		
		var result = {
			objects: [],
			errors: []
		};
		var stream = this.transport.send(properties.pattern);
		stream.main.on('readable', function() {
			var object = stream.main.read();
			if (object && typeof object == 'object') {
				result.objects.push(object);
				if (properties.read) properties.read(object);
			}
		});
		stream.error.on('readable', function() {
			var error = stream.error.read();
			if (error && typeof error == 'object') {
				result.errors.push(error);
				if (properties.error) properties.error(value);
			}
		});
		stream.main.on('end', function() {
			if (properties.receive) properties.receive(result);
		});
		stream.error.on('end', function() {
			if (false && properties.receive) properties.receive(result);
		});
		if (properties.data) {
			var data = properties.data;
			if (!(data instanceof Array)) {
				data = [data];
			}
			data.forEach(function(each) {
				stream.write(each);
			}.bind(this));
			stream.end();
		} else {
			if (properties.write) properties.write(stream);
		}
	},

	receive: function(request, streams) {
		
		streams.main.on('end', function() {
			streams.main.process.end();
		}.bind(this));
		streams.main.on('readable', function() {
			var value = streams.main.read();
			if (value) {
				streams.main.process.write(value);
			}
		}.bind(this));
		this.getProcess(request, streams, function(process) {
			streams.main.process = process;
		}.bind(this));
	},

	getProcess: function(request, streams, callback) {
		
		var request = new Request({
			pattern: request.pattern,
			candidates: this.register.getProcessors(request.versions)
		});
		request.prepare(function() {
			var process = new Process({
				processors: request.processors,
				streams: streams,
				request: request,
				response: new Response()
			});
			callback(process);
		});
	},

	process: function(processor) {

		this.register.addProcessor(processor);
	}
});
