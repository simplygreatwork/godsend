var Class = require('./Class');
var Connection = require('./Connection');
var assert = require('./Assertions');

Bus = module.exports = Class.extend({
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
		this.connections = [];
	},
	
	connect: function(properties) {
		
		assert.connecting(properties);
		var connection = new Connection({
			address: this.address,
			secure: this.secure,
			credentials: properties.credentials
		});
		if (properties.initialized) {
			properties.initialized(connection);
		}
		connection.connect(function(result) {
			if (result.errors && result.errors.length > 0) {
				connection.disconnect(function() {
					connection = null;
				});
			} else {
				this.connections.push(connection);
			}
			if (properties.connected) {
				if (result.errors && result.errors.length === 0) {
					properties.connected(connection);
				}
			}
			if (properties.errored) {
				if (result.errors && result.errors.length > 0) {
					properties.errored(result.errors);
				}
			}
			if (properties.responded) {
				properties.responded({
					connection: connection,
					errors: result.errors
				});
			}
		}.bind(this));
		return connection;
	}
});
