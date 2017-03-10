
godsend.ready(function(godsend) {

var Bus = godsend.Bus;
var Broker = godsend.Broker;
var Exchange = godsend.exchange.Open;

Example = Class.extend({
	
	initialize : function(properties) {
		
		var bus = new Bus({
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
			connected : function(properties) {
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
				console.log('Received message response from the server: ' + JSON.stringify(result));
			}.bind(this)
		});
	}
});

new Example({});
	
});
