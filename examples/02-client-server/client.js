
godsend.ready(function(godsend) {
Logger.ready(function() {

Example = Class.extend({
	
	initialize : function(properties) {
		
		var bus = new godsend.Bus({
			local : false
		});
		var sender = new Sender({
			bus : bus
		});
		sender.connect(function() {
			sender.start();
		}.bind(this));
	}
});

Sender = Class.extend({
	
	connect : function(callback) {
		
		this.bus.connect({
			credentials : {
				username : 'open',
				passphrase : 'open'
			},
			responded : function(properties) {
				this.connection = properties.connection;
				callback();
			}.bind(this)
		});
	},
	
	start : function() {
		
		this.connection.send({
			pattern : {
				topic : 'post-message'
			},
			data : {},
			receive : function(result) {
				Logger.get('main').log('Received message response from the server: ' + JSON.stringify(result));
			}.bind(this)
		});
	}
});

new Example({});
	
});
});
