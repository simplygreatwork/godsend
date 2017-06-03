var ss = require('socket.io-stream');
var Logger = require('js-logger');
var Bus = require('./Bus');
var User = require('./User');
var Utility = require('./Utility');
var assert = require('./Assertions');

var Open = Class.extend({
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
	},
	
	connect: function(callback) {
		
		callback();
	},
	
	exchange: function(request, stream, connection) {
		
		this.manage(stream);
		this.broker.connections.forEach(function(connection) {
			this.broadcast(request, stream, connection);
		}.bind(this));
	},
	
	manage: function(stream) {
		
		stream.restreams = [];
		stream.finished = 0;
		stream.main.on('readable', function() {
			var object = stream.main.read();
			if (object) {
				stream.restreams.forEach(function(restream) {
					restream.stack.push(object);
					restream.main.write(object);
				}.bind(this));
			}
		});
		stream.main.on('end', function() {
			stream.restreams.forEach(function(restream) {
				restream.error.end();
				restream.main.end();
			}.bind(this))
		});
		stream.main.on('error', function(error) {
			console.error('stream error: ' + error);
		});
	},

	broadcast: function(request, stream, connection) {

		var restream = {
			main: ss.createStream({
				highWaterMark: 1024,
				objectMode: true,
				allowHalfOpen: true
			}),
			error: ss.createStream({
				highWaterMark: 1024,
				objectMode: true,
				allowHalfOpen: true
			})
		};
		restream.stack = [];									// if a receiver returns an object unchanged, do not return to sender
		restream.received = false;							// and do not learn the request pattern
		restream.main.on('readable', function() {
			var data = restream.main.read();
			if (data) {
				var object = restream.stack.shift();
				if (this.received) { // a hook primarily for the learning exchange
					this.received(request, stream, restream, data, object, connection);
				} else {
					stream.main.write(data);
				}
			}
		}.bind(this));
		restream.error.on('readable', function() {
			var data = restream.error.read();
			if (data) {
				stream.error.write(data);
			}
		}.bind(this));
		restream.main.on('error', function(error) {
			console.error('restream error: ' + error);
		});
		restream.error.on('error', function(error) {
			console.error('restream error: ' + error);
		});
		restream.main.on('end', function() {
			stream.finished++;
			if (stream.finished === stream.restreams.length) {
				stream.main.end();
				stream.error.end();
			}
		}.bind(this));
		stream.restreams.push(restream);
		connection.emit('receive', request, {
			main: restream.main,
			error: restream.error
		});
	},
	
	received: function(request, stream, restream, data, object, connection) {
		
		var matches = true;
		if (object) {
			if (Utility.stringify(data) != Utility.stringify(object)) {
				matches = false;
			}
		} else {
			matches = false;
		}
		if (matches === false) {
			stream.main.write(data);
		}
	}
});

var Secure = Open.extend({
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
		this.initializeUsers();
		if (true) this.cache = new cache.Connection();
	},
	
	initializeUsers: function() {
		
		this.users = this.users || require('./users.json');
		if (this.users) {
			this.users = JSON.parse(JSON.stringify(this.users));
			assert.users(this.users);
			Object.keys(this.users).forEach(function(key) {
				this.users[key] = new User(this.users[key]);
			}.bind(this));
		} else {
			throw new Error('The secure exchange must be provided basic users.');
		}
	},
	
	connect: function(callback) { // authentication data will come from over the bus
		
		new Bus({
			address: this.broker.address
		}).connect({
			credentials: {
				username: this.users['broker'].credentials.username,
				passphrase: this.users['broker'].credentials.passphrase
			},
			initialized : function(connection) {
				this.connection = connection;
				this.process(connection);
			}.bind(this),
			connected: function(connection) { // next: now update broker and master user records (the patterns at least)
				this.connected = true;
				Logger.get('exchange').info('The secure broker exchange is now connected to the bus as a client.');
				this.connection = connection;
				callback();
			}.bind(this),
			errored : function(errors) {
				console.error('Connection errors: ' + errors);
				callback();
			}.bind(this)
		});
	},
	
	process: function(connection) { // the signin receiver should probably be on a separate external bus
		
		connection.mount({
			id: 'authentication-sign-in',
			on: function(request) {
				request.accept({
					topic: 'authentication',
					action: 'sign-in'
				});
			}.bind(this),
			run: function(stream) {
				var credentials = stream.object.credentials;
				this.load(credentials, function() {
					var authentic = this.authenticate(credentials);
					stream.push({
						authentic: authentic
					});
					if (authentic) {
						var connection = this.broker.findConnection(stream.request.connection);
						connection.credentials = credentials;
						this.notify('presence', 'online', credentials.username);
					} else {
						stream.error({
							message: 'That user could not be authenticated.'
						});
						Logger.get('exchange').info('A user could not be authenticated.', credentials);
					}
					stream.next();
				}.bind(this));
			}.bind(this)
		});
		
		connection.mount({
			id: 'authentication-sign-out',
			on: function(request) {
				request.accept({
					topic: 'authentication',
					action: 'sign-out'
				});
			}.bind(this),
			run: function(stream) {
				var connection = this.broker.findConnection(stream.request.connection);
				this.notify('presence', 'offline', connection.credentials.username);
				connection.credentials = null;
				delete connection.credentials;
				stream.push({
					authenticated : false
				});
				stream.next();
			}.bind(this)
		});
	},
	
	notify : function(topic, action, username, callback) {
		
		if (this.connection) {
			this.connection.send({
				pattern: {
					topic: topic,
					action: action
				},
				data: {
					username: username
				},
				receive: function(result) {
					if (callback) callback();
				}.bind(this)
			});
		}
	},
	
	err: function(stream, message) {
		
		Logger.get('exchange').error(message);
		console.error(message);
		stream.error.write(message);
		stream.main.end();
		stream.error.end();
	},
	
	load: function(credentials, callback) { // should user authentication be on a separate server-side only bus? less risk?
		
		if (this.connection.transport.connected) {
			if (this.users[credentials.username] === undefined) {
				this.connection.send({
					pattern: {
						topic: 'authentication',
						action: 'get-user'
					},
					data: {
						username: credentials.username
					},
					receive: function(result) {
						if (result.objects.length > 0) {
							var value = result.objects[0];
							if (false) console.log('loaded cached user: ' + JSON.stringify(value));
							this.users[credentials.username] = new User(value);
						}
						callback();
					}.bind(this)
				});
			} else {
				callback();
			}
		} else {
			callback();
		}
	},
	
	authenticate: function(credentials) {
		
		var result = false;
		var user = this.users[credentials.username];
		if (user) {
			if (user.credentials) {
				if (user.credentials.username == credentials.username) {
					if (user.credentials.passphrase == credentials.passphrase) {
						result = true;
					}
				}
			}
		}
		return result;
	},
	
	exchange: function(request, stream, connection) {
		
		if (connection.credentials) {
			Logger.get('exchange-secure').info('request.pattern: ' + JSON.stringify(request.pattern));
			this.manage(stream);
			var username = connection.credentials.username;
			var user = this.users[username];
			request.username = username;
			request.versions = user.versions;
			if (user && user.isSendable(request.pattern)) {
				var pattern = Utility.primitize(request.pattern);
				var connections = this.find(pattern);
				connections.forEach(function(connection) {
					this.broadcast(request, stream, connection);
				}.bind(this));
				if (connections.length === 0) {
					stream.main.end();
					stream.error.end();
				}
			} else {
				this.err(stream, 'The sender "' + username + '" is not allowed to send the pattern: ' + JSON.stringify(request.pattern));
			}
		} else {
			console.error('Connection is missing valid credentials.');
		}
	},
	
	find : function(pattern) {
		
		var connections = null;
		if (this.cache) connections = this.cache.get(pattern);
		if (! connections) {
			connections = [];
			var user = null;
			this.broker.connections.forEach(function(each) {
				if (each.credentials) {
					user = this.users[each.credentials.username];
					if (user.isReceivable(pattern)) {
						connections.push(each);
					}
				}
			}.bind(this));
			if (this.cache) this.cache.put(pattern, connections);
		}
		return connections;
	},
	
	patch : function(connection) {
		
		if (this.cache) {
			var user = this.users[connection.credentials.username];
			Object.keys(this.cache.cache).forEach(function(pattern) {
				if (user.isReceivable(pattern)) {
					var connections = this.cache.get(pattern);
					if ((connections) && (connections.indexOf(connection) === -1)) {
						connections.push(connection);
					}
				}
			}.bind(this));
		}
	},
	
	unpatch : function(connection) {
		
		if (this.cache) {
			var user = this.users[connection.credentials.username];
			Object.keys(this.cache.cache).forEach(function(pattern) {
				if (user.isReceivable(pattern)) {
					var connections = this.cache.get(pattern);
					if (connections) {
						var index = connections.indexOf(connection);
						if (index > -1) {
							connections.splice(index, 1);
						}
					}
				}
			}.bind(this));
		}
	}
});

var Learning = Secure.extend({
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
		this.initializeUsers();
	},
	
	initializeUsers: function() {
		
		this.users = this.users || require('./users.json');
		if (this.users) {
			this.users = JSON.parse(JSON.stringify(this.users));
			assert.users(this.users);
			Object.keys(this.users).forEach(function(key) {
				this.users[key] = new User(this.users[key]);
			}.bind(this));
		} else {
			throw new Error('The secure exchange must be provided basic users.');
		}
	},
	
	exchange: function(request, stream, connection) {
		
		if (connection.credentials) {
			Logger.get('exchange-learning').info('request.pattern: ' + JSON.stringify(request.pattern));
			this.manage(stream);
			var username = connection.credentials.username;
			var user = this.users[username];
			request.username = username;
			request.versions = user.versions;
			this.learn('sendable', request, user);
			if (user) {
				var sent = false;
				this.broker.connections.forEach(function(each) {
					if (each.credentials) {
						sent = true;
						this.broadcast(request, stream, each);
					}
				}.bind(this));
				if (!sent) {
					stream.main.end();
					stream.error.end();
				}
			} else {
				this.err(response, 'The sender "' + username + '" is not allowed to send the pattern: ' + JSON.stringify(request.pattern));
			}
		} else {
			console.error('Connection is missing valid credentials.');
		}
	},
	
	received: function(request, stream, restream, data, object, connection) {
		
		var matches = true;
		if (object) {
			if (Utility.stringify(data) != Utility.stringify(object)) {
				matches = false;
			}
		} else {
			matches = false;
		}
		if (matches === false) {
			stream.main.write(data);
			if (restream.received === false) {
				var username = connection.credentials.username;
				var user = this.users[username];
				this.learn('receivable', request, user);
				restream.received = true;
			}
		}
	},
	
	learn: function(type, request, user, callback) {
		
		if (!Utility.matchesProperties(request.pattern, {							// prevent cyclical issue
			topic: 'authentication',
			action: 'put-user'
		})) {
			var pattern = Utility.primitize(request.pattern);						// learn only the primitives in the pattern
			var added = user.addPattern(type, pattern);
			if (added) {
				Logger.get('exchange-learning').info('Added "' + type + '" for user "' + user.credentials.username + '".');
				this.save(user, callback);
			} else {
				Logger.get('exchange-learning').info('Pattern "' + type + '" already exists for user "' + user.credentials.username + '".');
				if (callback) callback();
			}
		}
	},
	
	save: function(user, callback) {
		
		this.connection.send({
			pattern: {
				topic: 'authentication',
				action: 'put-user'
			},
			data: user,
			receive: function(result) {
				console.log('Saved user "' + user.credentials.username + '".');
				if (callback) callback();
			}.bind(this)
		});
	}
});

exchange = module.exports = {

	Open: Open,
	Secure: Secure,
	Learning: Learning,
};
