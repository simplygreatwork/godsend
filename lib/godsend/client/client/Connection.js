
init = function() {

godsend.Connection = Class.extend({
	
	initialize : function(properties) {
		
		Object.assign(this, properties);
		this.handlers = [];
		this.receivers = [];
		this.initializeTransport();
	},
	
	initializeTransport : function() {
		
		if (this.local === false) {
			this.transport = new godsend.SocketTransport({
				connection : this
			});
		} else {
			this.transport = new godsend.LocalTransport({
				connection : this,
				broker : this.broker
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
			credentials : this.credentials,
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
		request.receivers = this.getReceivers();
		var request = new godsend.Request(request);
		request.response = response;
		request.start();
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
		
		var result = [];
		this.receivers.sort(function(a, b) {
			return a.weight - b.weight;
		});
		this.resolveWeights();
		this.receivers.sort(function(a, b) {
			return a.weight - b.weight;
		});
		this.receivers.forEach(function(each) {
			result.push(each);
		});
		return result;
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
