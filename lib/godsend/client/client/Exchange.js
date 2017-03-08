
init = function() {

if (godsend.exchange === undefined) godsend.exchange = {};

godsend.exchange.Open = Class.extend({
	
	initialize : function(properties) {
		
		Object.assign(this, properties);
	},
	
	exchange : function(request, response, connection) {
		
		this.broker.bus.connections.forEach(function(each) {
			if (each != connection) {
				each.received(request, response);
			}
		}.bind(this));
	}
});

godsend.exchange.Secure = Class.extend({
	
	initialize : function(properties) {
		
		Object.assign(this, properties);
	},
	
	exchangeSync : function(request, response, connection) {
		
		if (request.user.isSendable(request.pattern)) {
			var received = false;
			main.bus.connections.forEach(function(each) {
				if (each != connection) {
					var user = main.broker.findUserSync(each.credentials.username);
					if (user.isReceivable(request.pattern)) {
						each.received(request, response);
						received = true;
					}
				}
			}.bind(this));
			if (received === false) {
				response.respond({
					error : 'No pattern is available for receiving.'
				});
			}
		} else {
			response.respond({
				error : 'No pattern is available for sending.'
			});
		}
	},
	
	exchange : function(request, response, connection) {
		
		this.getUsers(function(users) {
			if (request.user.isSendable(request.pattern)) {
				var received = false;
				main.bus.connections.forEach(function(each) {
					if (each != connection) {
						var user = users[each.credentials.username];
						if (user.isReceivable(request.pattern)) {
							each.received(request, response);
							received = true;
						}
					}
				}.bind(this));
				if (received === false) {
					response.respond({
						error : 'No pattern is available for receiving.'
					});
				}
			} else {
				response.respond({
					error : 'No pattern is available for sending.'
				});
			}
		}.bind(this));
	},
	
	printUsers : function(users) {
		
		var array = [];
		for (var property in users) {
			array.push(property);
		}
		console.log('Connected users: ' + JSON.stringify(array));
	},
	
	getUsers : function(callback) {									// problem to solve: not finding the user in connected users
		
		if (false) {
			this.getConnectedUsers(callback);
		} else {
			this.getAllUsers(callback);
		}
	},
	
	getConnectedUsers : function(callback) {
		
		var users = {};
		var counter = 0;
		main.bus.connections.forEach(function(each, index) {
			main.broker.findUser({
				key : each.credentials.username,
				callback : function(user) {
					counter++;
					if (user) {
						users[user.credentials.username] = user;
					}
					if (counter === main.bus.connections.length - 1) {
						callback(users);
					}
				}.bind(this)
			});
		}.bind(this));
	},
	
	getAllUsers : function(callback) {
		
		var result = {}
		for (var username in storage.collections.users) {
			result[username] = new godsend.User(storage.collections.users[username]);
		}
		callback(result);
	},
	
	findUser : function(properties) {
		
		var result = null;
		var callback = properties.callback;
		storage.get({
			collection : 'users',
			key : properties.key,
			callback : function(properties) {
				if (properties.value) {
					result = new godsend.User(properties.value);
				}
				callback(result);
			}.bind(this)
		});
	}
	
});
	
};
