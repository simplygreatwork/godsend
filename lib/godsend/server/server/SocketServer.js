
init = function() {

godsend.SocketServer = Class.extend({
	
	initialize : function(properties) {
		
		Object.assign(this, properties);
		this.exchange = this.exchange || new godsend.exchange.Open();			// Open || Secure
		this.initializeBroker();
	},
	
	initializeBroker : function() {
		
		this.broker = new godsend.Broker({
			server : this.server,
			exchange : this.exchange
		});
	},
	
	start : function(callback) {
		
		this.broker.start(function() {
		   Logger.get('server').info('The broker has been started.');
			this.broker.exchange.connect(function() {
			   Logger.get('server').info('The broker exchange has been connected to the bus as a client.');
				callback();
			}.bind(this));
		}.bind(this));
	}
});
   
};
