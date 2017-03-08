
init = function() {

var io = require('socket.io-client');

godsend.transport = {
	
	Local : Class.extend({
		
		initialize : function(properties) {
			
			Object.assign(this, properties);
		},
		
		connect : function(callback) {
			
			callback();
		},
		
		send : function(request, response, connection) {
			
			this.broker.send(request, response, connection);
		},
		
		received : function(request, response) {
			
			this.connection.received(request, response);
		}
	}),
	
	Socket : Class.extend({
		
		initialize : function(properties) {
			
			Object.assign(this, properties);
		},
		
		connect : function(callback) {
			
			this.socket = io.connect('https://messaging-philmaker.c9users.io:8080/', {
			  secure : this.secure || false,
			  reconnection : true,
			  reconnectionDelay : 100,
			  reconnectionAttempts : 10
			});
			this.socket.on('connect', function() {
				console.log('Connected to socket.io server.');
				this.socket.emit('authenticate', this.connection.credentials, function(response) {
					callback();
		      });
			}.bind(this));
			this.socket.on('connect_error', function(error) {
				console.error('connect_error: ' + error);
				callback(error);
			});
			this.socket.on('receive', function(request, respond) {
				if (false) console.log('Received request:  ' + JSON.stringify(request));
				this.connection.received(request, {
					respond : respond
				});
			}.bind(this));
		},
		
		send : function(request, response, connection) {
			
			this.socket.emit('send', request, function(resp) {
	        response.respond(resp);
	      });
		},
		
		receive : function(properties) {
			
		}
	})
};

};
