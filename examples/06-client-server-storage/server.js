
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
				sendable : [],
				receivable : [{
					topic : 'store',
					action : 'put',
					collection : 'tasks'
				}, {
					topic : 'store',
					action : 'all',
					collection : 'tasks'
				}]
			}
		},
		'client' : {
			credentials : {
				username : Credentials.get('client').username,
				passphrase : Credentials.get('client').passphrase,
			},
			patterns : {
				sendable : [{
					topic : 'store',
					action : 'put',
					collection : 'tasks'
				}, {
					topic : 'store',
					action : 'all',
					collection : 'tasks'
				}],
				receivable : []
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
			id : 'store-all-tasks',
			on : function(request, response) {
				if (request.matches({
					topic : 'store',
					action : 'all',
					collection : 'tasks'
				})) {
					request.accept();
				} else {
					request.skip();
				}
			}.bind(this),
			run : function(request, response) {
				var collection = request.pattern.collection;
				this.storage[collection] = this.storage[collection] || {};
				if (request.data.fields) {
					var result = [];
					Object.keys(this.storage[collection]).forEach(function(key) {
						var each = this.storage[collection][key];
						var value = {};
						Object.keys(request.data.fields).forEach(function(property) {
							value[property] = each[property];
						}.bind(this));
						result.push(value);
						response.data = {
							value : result
						};
					}.bind(this));
				} else {
					response.data = {
						value : this.storage[collection]
					}
				}
				request.next();
			}.bind(this)
		});
		
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
			id : 'store-put-tasks-validate',
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
			}.bind(this),
			run : function(request, response) {
				console.log('Validating the task.');
				if (! request.data.value.title) {
					response.error = 'The task is not valid.';
					request.end();
				} else {
					request.next();
				}
			}.bind(this)
		});
		
		this.connection.receive({
			id : 'store-put-tasks-transform',
			before : 'store-put-tasks-validate',
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
			}.bind(this),
			run : function(request, response) {
				console.log('Transforming the task.');
				if (! request.data.value.id) request.data.value.id = request.data.key;
				if (! request.data.value.created) request.data.value.created = new Date();
				request.data.value.modified = new Date();
				request.next();
			}.bind(this)
		});
	}
});

new Example({});

});
