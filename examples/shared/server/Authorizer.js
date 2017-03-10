
var Credentials = require('./Credentials.js');
var Storage = require('./Storage.js');

Authorizer = module.exports = Class.extend({
	
	initialize : function(properties) {
		
		Object.assign(this, properties);
		this.storage = new Storage({
			users : this.users
		});
	},
	
	connect : function(callback) {
		
		this.bus = this.bus || new godsend.Bus({
			local : false,
			secure : false
		});
		this.bus.connect({
			credentials : {
				username : Credentials.get('authenticator').username,
				passphrase : Credentials.get('authenticator').passphrase,
			},
			connected : function(properties) {
				this.connection = properties.connection;
				this.receive();
				callback();
			}.bind(this)
		});
	},
	
	receive : function() {
		
		this.connection.receive({
			id : 'authentication-get-user',
			on : function(request, response) {
				if (request.matches({
					topic : 'authentication',
					action : 'get-user'
				})) {
					request.accept();
				} else {
					request.skip();
				}
			}.bind(this),
			run : function(request, response) {
				this.storage.get({
					collection : 'users',
					key : request.data.username,
					callback : function(properties) {
						response.data = properties.value;
						request.next();
					}
				});
			}.bind(this)
		});
		
		this.connection.receive({
			id : 'authentication-put-user',
			on : function(request, response) {
				if (request.matches({
					topic : 'authentication',
					action : 'put-user'
				})) {
					request.accept();
				} else {
					request.skip();
				}
			}.bind(this),
			run : function(request, response) {
				this.storage.get({
					collection : 'users',
					key : request.data.username,
					callback : function(properties) {
						if (properties.value) {
							response.error = 'The user already exists and may not be added.';
							request.end();
						} else {
							this.storage.put({
								collection : 'users',
								key : request.data.credentials.username,
								value : request.data,
								callback : function(properties) {
									if (properties.error) {
										response.data = {
											success : false
										};
									} else {
										response.data = {
											success : true
										};
									}
									request.next();
								}.bind(this)
							});
						}
					}.bind(this)
				});
			}.bind(this)
		});
	}
});
