
init = function() {

var assert = require('proclaim');

godsend.Bus = Class.extend({
	
	initialize : function(properties) {
		
		Object.assign(this, properties);
		this.connections = [];
	},
	
	connect : function(properties) {
		
		godsend.assert.credentials(properties.credentials);
		var connection = new godsend.Connection({
			address : this.address,
			secure : this.secure,
			credentials : properties.credentials
		});
		connection.connect(function(result) {
			if (result.errors && result.errors.length > 0) {
				connection.disconnect(function() {
					connection = null;
				});
			} else {
				this.connections.push(connection);
			}
			properties.responded({
				connection : connection,
				errors : result.errors
			});
		}.bind(this));
	}
});

};
