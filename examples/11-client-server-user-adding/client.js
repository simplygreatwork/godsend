
godsend.ready(function(godsend) {

var Bus = godsend.Bus;
var Broker = godsend.Broker;
var Exchange = godsend.exchange.Open;

Example = Class.extend({
	
	initialize : function(properties) {
		
		var sender = new Sender({
			bus : new Bus({
				local : false,
				broker : new Broker({
					exchange : new Exchange()
				})
			})
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
				username : Credentials.get('admin').username,
				passphrase : Credentials.get('admin').passphrase,
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
						topic : 'authentication',
						action : 'put-user'
					},
					data : {
						credentials : {
							username : Credentials.get('new-user').username,
							passphrase : Credentials.get('new-user').passphrase,
						},
						patterns : {
							sendable : [{
								topic : 'post-message'
							}],
							receivable : []
						}
					},
					receive : function(properties) {
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
							username : Credentials.get('new-user').username,
							passphrase : Credentials.get('new-user').passphrase,
						}
					},
					receive : function(properties) {
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
						message : 'Message from user "new-user".'
					},
					receive : function(properties) {
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
