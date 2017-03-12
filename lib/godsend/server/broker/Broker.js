
init = function() {

godsend.Broker = Class.extend({
	
	initialize : function(properties) {
		
		Object.assign(this, properties);
		this.exchange.broker = this;
	},
	
	start : function(callback) {
		
		console.log('Starting socket server.');
		this.connections = [];
		io = require('socket.io').listen(this.server);
		io.on('connection', function(socket) {
			this.connections.push(socket);
			socket.on('authenticate', function(credentials, respond) {
				this.authenticate(socket, credentials, respond);
			}.bind(this));
			socket.on('send', function(payload, respond) {
				this.send(socket, payload, respond);
			}.bind(this));
			socket.on('disconnect', function() {							// need to purge the user and clear credentials
				console.log('Client disconnected.');
				socket.credentials = null;
				delete socket.credentials;
				var index = this.connections.indexOf(socket);
				if (index > -1) {
					this.connections.splice(index, 1);
				}
			}.bind(this));
		}.bind(this));
		callback();
	},
	
	authenticate : function(socket, credentials, respond) {
		
		if (this.exchange.authenticate) {
			this.exchange.cache(credentials, function() {
				var authentic = this.exchange.authenticate(credentials);
				if (authentic) {
					socket.credentials = credentials;
					respond({
						value : {
							authentic : authentic
						},
						errors : []
					});
				} else {
					var message = '"' + credentials.username + '" is not authentic.'
					respond({
						value : {
							authentic : authentic
						},
						errors : [message]
					});
					console.log(message);
				}
			}.bind(this));
		} else {
			socket.credentials = credentials;
			respond({
				value : {},
				errors : []
			});
		}
	},
	
	send : function(socket, payload, respond) {
		
		if (socket.credentials) {
			var request = payload;
			request.connection = socket.id;
			var response = {
				data : {},
				respond : function(properties) {
					respond(properties);
				}
			};
			this.exchange.exchange(request, response, socket);
		} else {
			console.log('Connection is missing credentials.');
		}
	},
	
	findConnection : function(id) {
		
		var result = null;
		this.connections.forEach(function(each) {
			if (each.id == id) {
				result = each;
			}
		}.bind(this));
		return result;
	}
});

};
