
init = function() {

godsend.Broker = Class.extend({
	
	initialize : function(properties) {
		
		Object.assign(this, properties);
		this.exchange.broker = this;
		this.connections = [];
	},
	
	send : function(request, response, connection) {
		
		this.exchange.exchange(request, response, connection);
	}
});
	
};
