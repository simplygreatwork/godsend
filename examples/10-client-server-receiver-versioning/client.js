
godsend.ready(function(godsend) {
Logger.ready(function() {

Example = Class.extend({
	
	initialize : function(properties) {
		
		var bus = new godsend.Bus({
			local : false
		});
		new Sender({
			bus : bus
		}).connect(function(sender) {
			sender.start();
		}.bind(this));
	}
});

Sender = Class.extend({
	
	connect : function(callback) {
		
		this.bus.connect({
			credentials : {
				username : Credentials.get('sender').username,
				passphrase : Credentials.get('sender').passphrase,
			},
			connected : function(properties) {
				this.connection = properties.connection;
				callback(this);
			}.bind(this)
		});
	},
	
	start : function() {
		
		var sequence = Sequence.start(
			
			function() {
				
				this.connection.send({
					pattern : {
						topic : 'store',
						action : 'get',
						collection : 'tasks'
					},
					data : {
						key : uuid.v4()
					},
					receive : function(result) {
						Logger.get('main').log('Result: ' + JSON.stringify(result, null, 2));
						sequence.next();
					}.bind(this)
				});
				
			}.bind(this)
			
		);
	}
});

new Example({});
	
});
});
