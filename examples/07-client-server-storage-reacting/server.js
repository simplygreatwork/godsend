
require('../../lib/godsend/server/main.js').ready(function(godsend) {

var Server = require('../shared/server/Server.js');
var Authorizer = require('../shared/server/Authorizer.js');
var Credentials = require('../shared/server/Credentials.js');

Example = Class.extend({
	
	initialize : function(properties) {
		
		new Server().start(function() {
			new Authorizer({
				users : this.users
			}).connect(function() {
				new Agent().connect(function() {
					console.log('Everything has been started.');
				}.bind(this));
			});
		}.bind(this));
	},
   
   users : {
		'agent' : {
			credentials : {
				username : Credentials.get('agent').username,
				passphrase : Credentials.get('agent').passphrase,
			},
			patterns : {
				sendable : [{
					topic : 'store',
					action : 'put-notify',
				}],
				receivable : [{
					topic : 'store',
					action : 'put'
				}]
			}
		},
		'sender' : {
			credentials : {
				username : Credentials.get('sender').username,
				passphrase : Credentials.get('sender').passphrase,
			},
			patterns : {
				sendable : [{
					topic : 'store',
					action : 'put',
					collection : 'tasks'
				}, {
					topic : 'store',
					action : 'put',
					collection : 'patients'
				}],
				receivable : []
			}
		},
		'task-receiver' : {
			credentials : {
				username : Credentials.get('task-receiver').username,
				passphrase : Credentials.get('task-receiver').passphrase,
			},
			patterns : {
				sendable : [],
				receivable : [{
					topic : 'store',
					action : 'put-notify',
					collection : 'tasks'
				}]
			}
		},
		'patient-receiver' : {
			credentials : {
				username : Credentials.get('patient-receiver').username,
				passphrase : Credentials.get('patient-receiver').passphrase,
			},
			patterns : {
				sendable : [],
				receivable : [{
					topic : 'store',
					action : 'put-notify',
					collection : 'patients'
				}]
			}
		}

   }
});

Agent = Class.extend({
	
	initialize : function(properties) {
		
		Object.assign(this, properties);
		this.storage = {};
	},
	
	connect : function(callback) {
		
		this.bus = new godsend.Bus({
			address : 'http://127.0.0.1:8080/'
		});
		this.bus.connect({
			credentials : {
				username : Credentials.get('agent').username,
				passphrase : Credentials.get('agent').passphrase,
			},
			responded : function(result) {
				this.connection = result.connection;
				this.receive();
				callback();
			}.bind(this)
		});
	},
	
	receive : function() {
		
		this.connection.receive({
			id : 'store-put',
			cache : false,
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
				console.log('Putting the task.');
				var collection = request.pattern.collection;
				var key = request.data.key;
				this.storage[collection] = this.storage[collection] || {};
				this.storage[collection][key] = request.data.value;
				response.data = request.data;
				request.next();
			}.bind(this)
		});
		
		this.connection.receive({
			id : 'store-put-notify',
			after : 'store-put',
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
				console.log('Notifying the bus about the store put.');
				this.connection.send({
					pattern : {
						topic : 'store',
						action : 'put-notify',
						collection : request.pattern.collection
					},
					data : request.data,
					receive : function(result) {
						request.next();
					}.bind(this)
				});
			}.bind(this)
		});
	}
});

new Example({});

});
