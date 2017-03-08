
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
					done : function(properties) {
						console.log('Done: ' + JSON.stringify(properties));
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
					done : function(properties) {
						console.log('Done: ' + JSON.stringify(properties));
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
					done : function(properties) {
						console.log('Done: ' + JSON.stringify(properties));
						sequence.next();
					}.bind(this)
				});
				
			}.bind(this)
		);
	}
});

new Example({});
	
});
