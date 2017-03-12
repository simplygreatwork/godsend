
init = function() {
	
godsend.Bus = Class.extend({
	
	initialize : function(properties) {
		
		Object.assign(this, properties);
		if (this.broker) this.broker.bus = this;
		this.connections = [];
	},
	
	connect : function(properties) {
		
		var connection = new godsend.Connection({
			broker : this.broker,
			local : this.local,
			credentials : properties.credentials
		});
		connection.connect(function() {
			this.connections.push(connection);
			properties.responded({
				connection : connection
			});
		}.bind(this));
	}
});
	
};
