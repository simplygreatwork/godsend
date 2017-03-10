
godsend.ready(function(godsend) {

var Bus = godsend.Bus;
var Broker = godsend.Broker;
var Exchange = godsend.exchange.Open;

Example = Class.extend({
	
	initialize : function(properties) {
		
		var sender = new Sender({
			bus : new Bus({
				local : false
			})
		})
		sender.connect(function() {
			sender.start();
		}.bind(this));
	}
});

Sender = Class.extend({
	
	connect : function(callback) {
		
		this.bus.connect({
			credentials : {
				username : Credentials.get('client').username,
				passphrase : Credentials.get('client').passphrase,
			},
			connected : function(properties) {
				this.connection = properties.connection;
				callback();
			}.bind(this)
		});
	},
	
	start : function() {
		
		console.log('Sending request.');
		this.connection.send({
			pattern : {
				topic : 'post-message'
			},
			data : {
				message : 'Can you hear me now?'
			},
			receive : function(properties) {
				console.log('Received response: ' + JSON.stringify(properties));
			}.bind(this)
		});
	}
});

new Example({});
	
});
