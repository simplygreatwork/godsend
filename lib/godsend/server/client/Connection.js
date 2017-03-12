
init = function() {

var uuid = require('node-uuid');

godsend.Connection = Class.extend({
	
	initialize : function(properties) {
		
		Object.assign(this, properties);
		this.register = new godsend.Register();
		this.cache = new godsend.Cache();
		this.initializeTransport();
	},
	
	initializeTransport : function() {
		
		if (this.local === false) {
			this.transport = new godsend.transport.Socket({
				connection : this,
				secure : this.secure,
			});
		} else {
			this.transport = new godsend.transport.Local({
				connection : this,
				secure : this.secure,
				broker : main.broker
			});
		}
	},
	
	connect : function(callback) {
		
		this.transport.connect(callback);
	},
	
	disconnect : function(callback) {
		
		this.transport.disconnect(callback);
	},
	
	send : function(properties) {
		
		godsend.assert.pattern(properties.pattern);
		var respond = properties.receive;
		var request = {
			id : uuid.v4(),
			pattern : properties.pattern,
			data : properties.data,
		};
		var response = {
			data : {},
			respond : respond,
			send : respond,
			errors : []
		};
		this.transport.send(request, response, this);
	},
	
	received : function(request, response) {
		
		response.data = {};
		request = this.createRequest(request);
		request.response = response;
		request.start();
	},
	
	createRequest : function(request) {
		
		var receivers = this.cache.get(request.pattern);				// need to bust this cache if user versions change
		if (receivers) {
			request = new godsend.CachedRequest(request);
			request.receivers = receivers;
			request.cache = this.cache;
		} else {
			request = new godsend.Request(request);
			request.receivers = this.getReceivers(request.versions);
			request.cache = this.cache;
		}
		return request;
	},
	
	receive : function(properties) {
		
		this.register.addReceiver(properties);
	},
	
	getReceivers : function(versions) {
		
		return this.register.getReceivers(versions);
	},

	on : function() {
		
		
	}
});

};
