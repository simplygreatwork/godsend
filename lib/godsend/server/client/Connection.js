
init = function() {

var uuid = require('node-uuid');

godsend.Connection = Class.extend({
	
	initialize : function(properties) {
		
		Object.assign(this, properties);
		this.handlers = [];
		this.receivers = [];
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
	
	send : function(properties) {
		
		var socket = properties.socket;
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
		
		var receivers = this.cache.get(request.pattern);
		if (receivers) {
			request = new godsend.CachedRequest(request);
			request.receivers = receivers;
			request.cache = this.cache;
		} else {
			request = new godsend.Request(request);
			request.receivers = this.getReceivers();
			request.cache = this.cache;
		}
		return request;
	},
	
	receive : function(properties) {
		
		if (properties.weight === undefined) {
			properties.weight = 0;
		}
		this.receivers.push(properties);
		this.receivers.sort(function(a, b) {
			return a.weight - b.weight;
		});
	},
	
	getReceivers : function() {
		
		this.receivers.sort(function(a, b) {
			return a.weight - b.weight;
		});
		this.resolveWeights();
		this.receivers.sort(function(a, b) {
			return a.weight - b.weight;
		});
		return this.receivers;
	},
	
	resolveWeights : function() {								// actually need to value adjustent to be in the middle
		
		this.receivers.forEach(function(each) {
			if (each.before) {
				receiver = this.getReceiverById(each.before);
				if (receiver) {
					each.weight = receiver.weight - 0.1;
				}
			}
			if (each.after) {
				receiver = this.getReceiverById(each.after);
				if (receiver) {
					each.weight = receiver.weight + 0.1;
				}
			}
		}.bind(this));
	},
	
	getReceiverById : function(id) {
		
		var result = null;
		this.receivers.forEach(function(each) {
			if (each.id == id) {
				result = each;
			}
		});
		return result;
	},
	
	on : function() {
		
		
	}
});

};
