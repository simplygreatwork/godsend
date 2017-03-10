
init = function() {

godsend.exchange = {
	
	Open : Class.extend({
		
		initialize : function(properties) {
			
			Object.assign(this, properties);
		},
		
		connect : function(callback) {
			
			callback();
		},
		
		exchange : function(request, response, connection) {
			
			var array = [];
			var length = this.broker.connections.length;
			this.broker.connections.forEach(function(each, index) {
				if (each != connection) {
					each.emit('receive', request, function(data) {
						array.push(JSON.stringify(data));
						if (array.length === length - 1) {
							array.sort(function(a, b) {
								return a.length < b.length;											// revisit: only returning the most meaningful response for now
							});
							response.respond(JSON.parse(array[0]));
						}
					}.bind(this));
				}
			}.bind(this));
		}
	}),
	
	Secure : Class.extend({
		
		initialize : function(properties) {
			
			Object.assign(this, properties);
			this.initializeUsers();
			this.initializeBus();
		},
		
		initializeUsers : function() {
			
			this.users = this.users || require('./users.json');
			if (this.users) {
				Object.keys(this.users).forEach(function(key) {
					this.users[key] = new godsend.User(this.users[key]);
				}.bind(this));
			} else {
				throw new Error('The secure exchange must be provided basic users.');
			}
		},
		
		initializeBus : function() {
			
			this.bus = new godsend.Bus({
				local : false
			});
		},
		
		connect : function(callback) {										// authentication data will come from over the bus
			
			this.bus.connect({
				arbitrator : null,
				credentials : {
					username : 'broker',
					passphrase : 'passphrase-to-hash'
				},
				connected : function(properties) {							// next: now update broker and master user records (the patterns at least)
					this.connected = true;
					Logger.get('exchange').info('The secure broker exchange is now connected to the bus as a client.');
					this.connection = properties.connection;
					this.initializeReceivers();
					callback();
				}.bind(this)
			});
		},
		
		initializeReceivers : function() {									// the signin receiver should probably be external : remove this
			
			this.connection.receive({
				id : 'authentication-sign-in',
				on : function(request, response) {
					if (request.matches({
						topic : 'authentication',
						action : 'sign-in'
					})) {
						request.accept();
					} else {
						request.skip();
					}
				}.bind(this),
				run : function(request, response) {
					var credentials = request.data.credentials;
					this.cache(credentials, function() {
						var authentic = this.authenticate(credentials);
						response.data = {
							authentic : authentic
						};
						if (authentic) {
							var socket = this.broker.findConnection(request.connection);
							socket.credentials = credentials;
						} else {
							response.error = 'That user could not be authenticated.';
							Logger.get('exchange').info('User could not be authenticated.', credentials);
						}
						request.next();
					}.bind(this));
				}.bind(this)
			});
		},
		
		exchange : function(request, response, connection) {
			
			var username = connection.credentials.username;
			request.user = this.users[username];
			if (request.user) {
				if (request.user.isSendable(request.pattern)) {
					var receivables = 0;
					this.broker.connections.forEach(function(each) {
						if (each != connection) {
							if (each.credentials) {
								var user = this.users[each.credentials.username];
								if (user.isReceivable(request.pattern)) {
									receivables++;
								}
							}
						}
					}.bind(this));
					if (receivables > 0) {
						var array = [];
						this.broker.connections.forEach(function(each) {
							if (each != connection) {
								if (each.credentials) {
									var user = this.users[each.credentials.username];
									if (user.isReceivable(request.pattern)) {
										each.emit('receive', request, function(data) {
											array.push(JSON.stringify(data));
											if (array.length === receivables) {
												array.sort(function(a, b) {											
													return a.length < b.length;								// revisit: only returning the most meaningful response for now
												});
												response.respond(JSON.parse(array[0]));
											}
										}.bind(this));
									}
								}
							}
						}.bind(this));
					} else {
						this.err(response, 'No receivers are allowed to receive the pattern: ' + JSON.stringify(request.pattern));
					}
				} else {
					this.err(response, 'The sender "' + username + '" is not allowed to send the pattern: ' + JSON.stringify(request.pattern));
				}
			} else {
				this.err(response, 'The user "' + username + '" could not be found to validate this request.');
			}
		},
		
		err : function(response, message) {
			
			Logger.get('exchange').error(message);
			response.respond({
				errors : [message]
			});
		},
		
		cache : function(credentials, callback) {							// should user authentication be on a separate server-side only bus? less risk?
			
			if (this.connected) {												// actually check the connection to see if connected
				this.connection.send({
					pattern : {
						topic : 'authentication',
						action : 'get-user'
					},
					data : {
						username : credentials.username
					},
					receive : function(result) {
						if (result && result.value) {
							if (false) console.log('loaded cached user: ' + JSON.stringify(result.value));
							this.users[credentials.username] = new godsend.User(result.value);
						}
						callback();
					}.bind(this)
				});
			} else {
				callback();
			}
		},
		
		authenticate : function(credentials) {
			
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
		}
	}),
	
	Learning : Class.extend({
		
		initialize : function(properties) {
			
			Object.assign(this, properties);
			this.initializeUsers();
			this.initializeBus();
		},
		
		initializeUsers : function() {
			
			this.users = this.users || require('./users.json');
			if (this.users) {
				Object.keys(this.users).forEach(function(key) {
					this.users[key] = new godsend.User(this.users[key]);
				}.bind(this));
			} else {
				throw new Error('The secure exchange must be provided with basic, original users.');
			}
		},
		
		initializeBus : function() {
			
			this.bus = new godsend.Bus({
				local : false
			});
		},
		
		connect : function(callback) {
			
			this.bus.connect({
				arbitrator : null,
				credentials : {
					username : 'broker',
					passphrase : 'passphrase-to-hash'
				},
				connected : function(properties) {							// next: now update broker and master user records (the patterns at least)
					this.connected = true;
					Logger.get('exchange').info('The secure broker exchange is now connected to the bus as a client.');
					this.connection = properties.connection;
					this.initializeReceivers();
					callback();
				}.bind(this)
			});
		},
		
		initializeReceivers : function() {									// the signin receiver should probably be external : remove this
			
			this.connection.receive({
				id : 'authentication-sign-in',
				on : function(request, response) {
					if (request.matches({
						topic : 'authentication',
						action : 'sign-in'
					})) {
						request.accept();
					} else {
						request.skip();
					}
				}.bind(this),
				run : function(request, response) {
					var credentials = request.data.credentials;
					this.cache(credentials, function() {
						var authentic = this.authenticate(credentials);
						response.data = {
							authentic : authentic
						};
						if (authentic) {
							var socket = this.broker.findConnection(request.connection);
							socket.credentials = credentials;
						} else {
							response.error = 'That user could not be authenticated.';
							Logger.get('exchange').info('User could not be authenticated.', credentials);
						}
						request.next();
					}.bind(this));
				}.bind(this)
			});
		},
		
		exchange : function(request, response, connection) {
			
			var username = connection.credentials.username;
			var user = this.users[username];
			request.user = user;
			if (request.user) {
				this.learn('sendable', request, user);
				var receivables = 0;
				this.broker.connections.forEach(function(each) {									// issue: hangs if I remove this block
					if (each != connection) {
						if (each.credentials) {
							receivables++;
						}
					}
				}.bind(this));
				if (receivables > 0) {
					var array = [];
					this.broker.connections.forEach(function(each) {
						if (each != connection) {
							if (each.credentials) {
								each.emit('receive', request, function(data) {
									array.push({
										connection : each,
										data : JSON.stringify(data)
									});
									if (array.length === receivables) {
										array.sort(function(a, b) {
											return a.data.length < b.data.length;						// revisit: only returning the most meaningful response for now
										});
										array.forEach(function(each) {
											if (godsend.Utility.isHandled(JSON.parse(each.data))) {
												var user = this.users[array[0].connection.credentials.username];
												this.learn('receivable', request, user);
											}
										}.bind(this));
										response.respond(JSON.parse(array[0].data));
									}
								}.bind(this));
							}
						}
					}.bind(this));
				} else {
					this.err(response, 'No receivers are allowed to receive the pattern: ' + JSON.stringify(request.pattern));
				}
			} else {
				this.err(response, 'The user "' + username + '" could not be found to validate this request.');
			}
		},
		
		err : function(response, message) {
			
			Logger.get('exchange').error(message);
			response.respond({
				errors : [message]
			});
		},
		
		cache : function(credentials, callback) {
			
			this.load(credentials, callback);
		},
		
		load : function(credentials, callback) {							// should user authentication be on a separate server-side only bus? less risk?
			
			if (this.connected) {												// actually want to check the connection to see if connected
				this.connection.send({
					pattern : {
						topic : 'authentication',
						action : 'get-user'
					},
					data : {
						username : credentials.username
					},
					receive : function(result) {
						if (result && result.value) {
							if (false) console.log('loaded cached user: ' + JSON.stringify(result.value));
							this.users[credentials.username] = new godsend.User(result.value);
						}
						callback();
					}.bind(this)
				});
			} else {
				callback();
			}
		},
		
		learn : function(type, request, user, callback) {
			
			if (! godsend.Utility.matchesProperties(request.pattern, {
				topic : 'authentication',
				action : 'put-user'
			})) {
				var added = user.addPattern(type, request.pattern);
				if (added) {
					console.log('Updated "' + type + '" for user "' + user.credentials.username + '".');
					this.save(user, callback);
				} else {
					console.log('Pattern "' + type + '" already exists for user "' + user.credentials.username + '".');
					if (callback) callback();
				}
			}
		},
		
		save : function(user, callback) {
			
			this.connection.send({
				pattern : {
					topic : 'authentication',
					action : 'put-user'
				},
				data : user,
				receive : function(result) {
					console.log('Saved user "' + user.credentials.username + '".');
					if (callback) callback();
				}.bind(this)
			});
		},
		
		authenticate : function(credentials) {
			
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
		}
	})
};

};
