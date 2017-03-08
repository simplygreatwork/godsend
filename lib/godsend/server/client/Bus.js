
init = function() {

godsend.Bus = Class.extend({
	
	initialize : function(properties) {
		
		Object.assign(this, properties);
		this.connections = [];
	},
	
	connect : function(properties) {
		
		var connection = new godsend.Connection({
			local : this.local,
			secure : this.secure,
			credentials : properties.credentials
		});
		connection.connect(function() {
			this.connections.push(connection);
			properties.connected({
				connection : connection
			});
		}.bind(this));
	}
});

};
