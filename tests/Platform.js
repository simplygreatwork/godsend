
var Class = require('../godsend.js').Class;
var Bus = require('../godsend.js').Bus;
var Server = require('../examples/shared/server/Server.js');
var Authorizer = require('../examples/shared/server/Authorizer.js');
var Credentials = require('../examples/shared/server/Credentials.js');

Platform = module.exports = Class.extend({
	
	start : function(callback) {
		
		new Server().start(function() {
			new Authorizer({
				users : this.users
			}).connect(function() {
				new Agent().connect(function() {
					console.log('Everything has been started.');
					callback();
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
					topic : 'post-message'
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
					topic : 'post-message'
				}],
				receivable : []
			}
		}
   }
});

Agent = Class.extend({
	
	initialize : function(properties) {
		
		Object.assign(this, properties);
	},
	
	connect : function(callback) {
		
		this.bus = new Bus({
			address : 'http://127.0.0.1:8080/'
		});
		this.bus.connect({
			credentials : {
				username : Credentials.get('agent').username,
				passphrase : Credentials.get('agent').passphrase,
			},
			responded : function(result) {
				this.connection = result.connection;
				this.process();
				callback();
			}.bind(this)
		});
	},
	
	process : function() {
		
		this.connection.process({
			id : 'post-message',
			on : function(request, response) {
				request.accept({
					topic : 'post-message'
				});
			}.bind(this),
			run : function(stream) {
				stream.push('Received a message from the client securely: ' + JSON.stringify(stream.object));
				stream.next();
			}.bind(this)
		});
	}
});
