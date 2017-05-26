
var Class = require('./Class');
var Transport = require('./Transport');
var Sender = require('./Sender');
var Receiver = require('./Receiver');
var Register = require('./Register');
var Cache = require('./Cache');
var Process = require('./Process');
var Request = require('./Request');
var Response = require('./Response');

Connection = module.exports = Class.extend({
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
		this.initializeTransport();
		this.sender = new Sender({
			connection : this
		});
		this.receiver = new Receiver({
			connection : this
		});
	},
	
	initializeTransport : function() {
		
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
	
	getProcess: function(register, request, streams, callback) {
		
		var processors = register.cache.get(request.versions, request.pattern);
		if (processors) {
			var process = new Process({
				connection : this,
				processors: processors,
				streams: streams,
				request: request,
				response: new Response()
			});
			callback(process);
		} else {
			request = new Request({
				pattern: request.pattern,
				username: request.username,
				candidates: register.getProcessors(request.versions)
			});
			request.prepare(function() {
				request.processors = register.sortProcessorsByExecution(request.processors);
				register.cache.put(request.versions, request.pattern, request.processors);
				var process = new Process({
					connection : this,
					processors: request.processors,
					streams: streams,
					request: request,
					response: new Response()
				});
				callback(process);
			}.bind(this));
		}
	},
	
	getRegister : function(route) {
		
		var route = route || 'rebound';
		if (route == 'rebound') {
			return this.receiver.register;
		} else if (route == 'outbound') {
			return this.sender.register.outbound;
		} else if (route == 'inbound') {
			return this.sender.register.inbound;
		}
	},
	
	send : function(sendable) {
		
		this.sender.send(sendable);
	},
	
	mount: function(properties) {
		
		var register = this.getRegister(properties.route);
		register.addProcessor(properties);
	},
	
	unmount: function(properties) {
		
		var register = this.getRegister(properties.route);
		register.removeProcessor(properties);
	},
	
	remount : function(properties) {
		
		var register = this.getRegister(properties.route);
		register.modifyProcessor(properties);
	},
	
	install : function(properties) {
		
		properties.service.connection = this;
		properties.service.install(properties);
	}
});
