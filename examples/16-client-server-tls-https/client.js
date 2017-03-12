
godsend.ready(function(godsend) {
Logger.ready(function() {

Example = Class.extend({
	
	initialize : function(properties) {
		
		var sender = new Sender({
			bus : new godsend.Bus({
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
			responded : function(properties) {
				this.connection = properties.connection;
				callback();
			}.bind(this)
		});
	},
	
	start : function() {
		
		Logger.get('main').log('Sending request.');
		this.connection.send({
			pattern : {
				topic : 'post-message'
			},
			data : {
				message : 'Can you hear me now?'
			},
			receive : function(result) {
				Logger.get('main').log('Received response: ' + JSON.stringify(result));
			}.bind(this)
		});
	}
});

new Example({});
	
});
});
