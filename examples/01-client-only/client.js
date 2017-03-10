
godsend.ready(function(godsend) {
Logger.ready(function() {

Example = Class.extend({
	
	initialize : function(properties) {
		
		var bus = new godsend.Bus({
			local : true,
			broker : new godsend.Broker({
				exchange : new godsend.Exchange()
			})
		});
		var sender = new Sender({
			bus : bus
		});
		var receiver = new Receiver({
			bus : bus
		});
		receiver.connect(function() {
			sender.connect(function() {
				sender.start();
			}.bind(this));
		}.bind(this));
	}
});

Receiver = Class.extend({
	
	connect : function(callback) {
		
		this.bus.connect({
			credentials : {
				username : 'client-receiver',
				passphrase : 'passphrase-to-hash'
			},
			connected : function(properties) {
				this.connection = properties.connection;
				this.receive();
				callback();
			}.bind(this)
		});
	},
	
	receive : function() {
		
		this.connection.receive({
			id : 'post-message',
			on : function(request, response) {
				if (request.matches({
					topic : 'post-message'
				})) {
					request.accept();
				} else {
					request.skip();
				}
			}.bind(this),
			run : function(request, response) {
				response.data = {
					message : 'Received the message!'
				}
				request.next();
			}.bind(this)
		});
	}
});

Sender = Class.extend({
	
	connect : function(callback) {
		
		this.bus.connect({
			credentials : {
				username : 'client-sender',
				passphrase : 'passphrase-to-hash'
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
				Logger.get('main').log('Received message response: ' + JSON.stringify(result));
			}.bind(this)
		});
	}
});

new Example({});
	
});
});
