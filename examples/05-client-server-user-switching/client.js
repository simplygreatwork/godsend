
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
				username : Credentials.get('public').username,
				passphrase : Credentials.get('public').passphrase,
			},
			connected : function(properties) {
				this.connection = properties.connection;
				callback();
			}.bind(this)
		});
	},
	
	start : function() {
		
		var sequence = Sequence.start(
			
			function() {
				
				this.connection.send({
					pattern : {
						topic : 'post-message'
					},
					data : {
						message : 'Message'
					},
					receive : function(result) {
						Logger.get('main').log('Result: ' + JSON.stringify(result));
						sequence.next();
					}.bind(this)
				});
				
			}.bind(this),
			
			function() {
				
				this.connection.send({
					pattern : {
						topic : 'authentication',
						action : 'sign-in'
					},
					data : {
						credentials : {
							username : Credentials.get('client').username,
							passphrase : Credentials.get('client').passphrase,
						},
					},
					receive : function(result) {
						Logger.get('main').log('Result: ' + JSON.stringify(result));
						sequence.next();
					}.bind(this)
				});
				
			}.bind(this),
			
			function() {
				
				this.connection.send({
					pattern : {
						topic : 'post-message'
					},
					data : {
						message : 'Message'
					},
					receive : function(result) {
						Logger.get('main').log('Result: ' + JSON.stringify(result));
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
