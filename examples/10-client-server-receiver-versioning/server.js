
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
					action : 'get'
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
					action : 'get',
					collection : 'tasks'
				}],
				receivable : []
			},
			versions : {
				'store-get-tasks-transform' : ' unversioned '
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
			local : false
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
			id : 'store-get',
			cache : false,
			on : function(request, response) {
				if (request.matches({
					topic : 'store',
					action : 'get'
				})) {
					request.accept();
				} else {
					request.skip();
				}
			}.bind(this),
			run : function(request, response) {
				console.log('Getting the task.');
				response.data = {
					title : 'Untitled Task',
					done : false
				};
				request.next();
			}.bind(this)
		});
		
		this.connection.receive({
			id : 'store-get-tasks-transform',
			after : 'store-get',
			on : function(request, response) {
				if (request.matches({
					topic : 'store',
					action : 'get',
					collection : 'tasks'
				})) {
					request.accept();
				} else {
					request.skip();
				}
			}.bind(this),
			run : function(request, response) {
				console.log('Transforming the task. (unversioned)');
				request.next();
			}.bind(this)
		});
		
		this.connection.receive({
			id : 'store-get-tasks-transform',
			version : {
				name : 'version-two',
				'default' : true
			},
			after : 'store-get',
			on : function(request, response) {
				if (request.matches({
					topic : 'store',
					action : 'get',
					collection : 'tasks'
				})) {
					request.accept();
				} else {
					request.skip();
				}
			}.bind(this),
			run : function(request, response) {
				console.log('Transforming the task. (v2 : default)');
				request.next();
			}.bind(this)
		});
		
		this.connection.receive({
			id : 'store-get-tasks-transform',
			version : 'version-three',
			after : 'store-get',
			on : function(request, response) {
				if (request.matches({
					topic : 'store',
					action : 'get',
					collection : 'tasks'
				})) {
					request.accept();
				} else {
					request.skip();
				}
			}.bind(this),
			run : function(request, response) {
				console.log('Transforming the task. (v3)');
				request.next();
			}.bind(this)
		});
	}
});

new Example({});

});
