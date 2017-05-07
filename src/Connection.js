
var Class = require('./Class');
var Stream = require('./Stream');
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
		this.cache = new Cache();
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
		
		var request = new Request({
			pattern: request.pattern,
			candidates: register.getProcessors(request.versions)
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
		if (properties.service) {
			properties.service.connection = this;
			properties.service.mount(properties);
		} else {
			register.addProcessor(properties);
		}
	},
	
	unmount: function(properties) {
		
		var register = this.getRegister(properties.route);
		register.removeProcessor(properties);
	},
	
	remount : function(properties) {
		
		var register = this.getRegister(properties.route);
		register.modifyProcessor(properties);
	}
});
