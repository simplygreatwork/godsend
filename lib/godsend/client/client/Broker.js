
init = function() {

godsend.Broker = Class.extend({
	
	initialize : function(properties) {
		
		Object.assign(this, properties);
		this.exchange.broker = this;
		this.connections = [];
	},
	
	send : function(request, response, connection) {
		
		var credentials = request.credentials;
		var username = 'client-public';
		if (request.credentials) {
			username = request.credentials.username;
		}
		this.exchange.exchange(request, response, connection);
	}
});
	
};
