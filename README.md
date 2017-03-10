# Godsend
Simple and elegant messaging for microservices

https://www.notion.so/Messaging-30c17b4e590f44689d9571f1f1f690c0

This project is not currently suitable for production.
Security, error handling, and fault tolerance need more evaluation.

When loading client pages in your browser, check the JavaScript console for message output.

	e.g. http://127.0.0.1/godsend/examples/

### Key Features

- A clean, concise, yet expressive API
- Property-based message patterns.
- Mutable composition: inject message receivers from any location in your application to decouple concerns such as validation and transformation.
- Multiple message receivers are able to process, filter, and transform a particular message request in a controlled, composed order as a linked list.
- The secure messaging exchange learns authorization automatically (with exercise).
- Message receivers may be versioned according to the connected user. Receiver versions are dynamically substituted in the receiver list upon each user's request. (coming soon)
- Few assumptions
	- Universal/isomorphic (in the browser and in Node.js)
	- The messaging scheme is totally open and configurable per receiver and is not necessary predetermined to use wildcards or regular expressions for pattern matching. But you can. The default and intended scheme is to match multiple property/value pairs within an object.

### Public Development @ Cloud9

[Cloud9 Preview](https://preview.c9users.io/philmaker/messaging/godsend/)

[Sign-in | Cloud9 IDE - Ajax.org](https://ide.c9.io/philmaker/messaging)

### Examples

### Create a bus to connect to

	this.bus = new Bus({
		...
	});

### Connect to the bus initially as a public user

	this.bus.connect({
		credentials : {
			username : 'client-public',
			passphrase : ''
		},
		connected : function(properties) {
			this.connection = properties.connection;
			this.initializeServices();
		}.bind(this)
	});

### Change the credentials to become an admin user 

	this.connection.send({
		pattern : {
			topic : 'signin'
		},
		data : {
			credentials : {
				username : 'client-admin',
				passphrase : Utility.digest('passphrase-to-hash')
			}
		},
		receive : function(result) {
			if (result.final) {
				this.console.log('Result after attempting to sign in: ' + JSON.stringify(result));
				sequence.next();
			}
		}.bind(this)
	});
	

### Create a new user which defines the user's authorized capabilities

	this.connection.send({
		pattern : {
			topic : 'store',
			action : 'put',
			collection : 'users'
		},
		data : {
			key : 'client-alpha',
			value : {
				credentials : {
					username : 'client-alpha',
					passphrase : Utility.digest('passphrase-to-hash')
				},
				patterns : {
					sendable : [{
						topic : 'register'
					}, {
						topic : 'signin'
					}, {
						topic : 'signout'
					}, {
						topic : 'store',
						action : 'find',
						collection : 'tasks'
					}, {
						topic : 'store',
						action : 'put',
						collection : 'tasks'
					}, {
						topic : 'store',
						action : 'get',
						collection : 'tasks'
					}, {
						topic : 'store',
						action : 'create',
						collection : 'tasks'
					}, {
						topic : 'store',
						action : 'read',
						collection : 'tasks'
					}, {
						topic : 'store',
						action : 'update',
						collection : 'tasks'
					}, {
						topic : 'store',
						action : 'delete',
						collection : 'tasks'
					}],
					receivable : []
				}
			}
		},
		receive : function(result) {
			if (result.final) {
				this.console.log('Added a new user: ' + JSON.stringify(result));
				sequence.next();
			}
		}.bind(this)
	});

### Intercept and validate the request to store a user by validating the request data

	this.connection.receive({
		id : 'store-validate-user',
		before : 'store-put',
		on : function(request, response) {
			if (request.matches({
				topic : 'store',
				action : 'put',
				collection : 'users'
			})) {
				request.accept();
			} else {
				request.skip();
			}
		},
		run : function(request, response) {
			if (valid) {
				request.next();
			} else {
				response.respond({
					error : 'The user is invalid.'
				});
			}
		}.bind(this)
	});

### Spawn a new client connection as a public user

	this.bus.main.connect({
		credentials : {
			username : 'client-public',
			passphrase : ''
		},
		connected : function(properties) {
			this.connection = properties.connection;
			this.initializeServices();
		}.bind(this)
	});

### Change the client connection's credentials to become the newly created user 

	this.connection.send({
		pattern : {
			topic : 'signin'
		},
		data : {
			credentials : {
				username : 'client-alpha',
				passphrase : ''
			}
		},
		receive : function(result) {
			if (result.final) {
				this.console.log('Client result after attempting to signin: ' + JSON.stringify(properties));
				sequence.next();
			}
		}.bind(this)
	});
	

### Send a message to store a task

	this.connection.send({
		pattern : {
			topic : 'store',
			action : 'put',
			collection : 'tasks'
		},
		data : {
			key : uuid.v4(),
			value : {
				subject : 'New Task'
			}
		},
		receive : function(result) {
			if (result.final) {
				this.console.log('Client result after attempting to put a new task: ' + JSON.stringify(result));
				this.task = result.value;
				this.console.log('This is the new task: ' + JSON.stringify(this.task.value));
				sequence.next();
			}
		}.bind(this)
	});

### Receive a message to store data to any named collection

	this.connection.receive({
		id : 'store-put',
		on : function(request, response) {
			if (request.matches({
				topic : 'store',
				action : 'put'
			})) {
				request.accept();
			} else {
				request.skip();
			}
		}.bind(this),
		run : function(request, response) {
			storage.put({
				collection : request.pattern.collection,
				key : request.data.key,
				value : request.data.value,
				callback : function(properties) {
					response.data = {
						key : request.data.key,
						value : request.data.value
					};
					request.next();
				}.bind(this)
			});
		}.bind(this)
	});
	

### Filter the request to store any data by adding a creation date or modification date

The property `before` inserts the receiver to execute before the data is stored.

	this.connection.receive({
		id : 'store-transform-date',
		before : 'store-put',
		on : function(request, response) {
			if (request.matches({
				topic : 'store',
				action : 'put'
			})) {
				request.accept();
			} else {
				request.skip();
			}
		},
		run : function(request, response) {
			storage.get({
				collection : request.pattern.collection,
				key : request.data.key,
				callback : function(properties) {
					var value = properties.value;
					if (value) {
						request.data.value.modified = new Date();
					} else {
						request.data.value.created = new Date();
					}
					storage.put({
						collection : request.pattern.collection,
						key : request.data.key,
						value : request.data.value,
						callback : function(properties) {
							request.next();
						}.bind(this)
					});
				}.bind(this)
			});
		}.bind(this)
	});

### Filter a request to store task data by validating the request's data

	this.connection.receive({
		id : 'store-validate-task',
		before : 'store-put',
		on : function(request, response) {
			if (request.matches({
				topic : 'store',
				action : 'put',
				collection : 'tasks'
			})) {
				request.accept();
			} else {
				request.skip();
			}
		},
		run : function(request, response) {
			if (valid) {
				request.next();
			} else {
				response.respond({
					error : 'The task is invalid.'
				});
			}
		}.bind(this)
	});

### Send a request for a particular version of a receiver

	

### Broadcast changes in real time after altering data in storage

Add a receiver to run `after` data has been put in a storage collection.

	

### Mutate a received request and resend to a new route pattern on the bus

	

### Clone a received request, mutate, and resend to a new route pattern on the bus

	

### Clone a received request, mutate, and resend to a new route pattern on a different bus

