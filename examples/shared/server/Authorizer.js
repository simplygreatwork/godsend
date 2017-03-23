
var Class = require('../../../godsend.js').Class;
var Bus = require('../../../godsend.js').Bus;
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
		
		this.bus = new Bus({
			address : 'http://127.0.0.1:8080/',
			secure : false
		});
		this.bus.connect({
			credentials : {
				username : Credentials.get('authenticator').username,
				passphrase : Credentials.get('authenticator').passphrase,
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
			id : 'authentication-get-user',
			on : function(request) {
				if (request.matches({
					topic : 'authentication',
					action : 'get-user'
				})) {
					request.accept();
				} else {
					request.skip();
				}
			}.bind(this),
			run : function(stream) {
				this.storage.get({
					collection : 'users',
					key : stream.object.username,
					callback : function(properties) {
						stream.push(properties.value);
						stream.next();
					}
				});
			}.bind(this)
		});
		
		this.connection.process({
			id : 'authentication-put-user',
			on : function(request) {
				if (request.matches({
					topic : 'authentication',
					action : 'put-user'
				})) {
					request.accept();
				} else {
					request.skip();
				}
			}.bind(this),
			run : function(stream) {
				this.storage.get({
					collection : 'users',
					key : stream.object.username,
					callback : function(properties) {
						if (properties.value) {
							stream.error({
								message : 'The user already exists and may not be added.'
							});
						} else {
							this.storage.put({
								collection : 'users',
								key : stream.object.credentials.username,
								value : stream.object,
								callback : function(properties) {
									if (properties.error) {
										stream.push({
											success : false
										});
									} else {
										stream.push({
											success : true
										});
									}
									stream.next();
								}.bind(this)
							});
						}
					}.bind(this)
				});
			}.bind(this)
		});
	}
});
