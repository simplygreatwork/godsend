
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
		
		disconnect : function(callback) {
			
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
			
			this.socket = io.connect('https://127.0.0.1:8080/', {
			  secure : this.secure || false,
			  reconnection : true,
			  reconnectionDelay : 100,
			  reconnectionAttempts : 10
			});
			this.socket.on('connect', function() {
				if (this.connection.credentials) {
					this.socket.emit('authenticate', this.connection.credentials, function(result) {
						if (result && result.value && result.value.authentic) {
							var username = this.connection.credentials.username;
							Logger.get('transport').log('Connected to the broker as "' + username + '".');
						}
						callback(result);
			      }.bind(this));
				} else {
					Logger.get('transport').log('Connected to the broker.');
					callback();
				}
			}.bind(this));
			this.socket.on('connect_error', function(error) {
				Logger.get('transport').log('connect_error: ' + error);
				callback(error);
			});
			this.socket.on('receive', function(request, respond) {
				this.receive(request, {
					respond : respond
				});
			}.bind(this));
		},
		
		disconnect : function(callback) {
			
			this.socket.close();
			callback();
		},
		
		send : function(request, response, connection) {
			
			this.socket.emit('send', request, function(resp) {
	        response.respond(resp);
	      });
		},
		
		receive : function(request, response) {
			
			if (false) Logger.get('transport').log('Received request:  ' + JSON.stringify(request));
			this.connection.received(request, response);
		}
	})
};

};
