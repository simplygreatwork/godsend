var Class = require('./Class');
var Connection = require('./Connection');
var assert = require('./Assertions');

Bus = module.exports = Class.extend({
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
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
			}
			if (result.errors && result.errors.length === 0) {
				if (properties.connected) {
					properties.connected(connection);
				}
			}
			if (result.errors && result.errors.length > 0) {
				if (properties.errored) {
					properties.errored(result.errors);
				} else {
					if (properties.credentials) {
						console.error('Error connecting to the bus as "' + JSON.stringify(properties.credentials) + '".');
					} else {
						console.error('Error connecting to the bus.');
					}
				}
			}
		}.bind(this));
		return connection;
	}
});
