
var godsend = module.exports = {
	Assertions : require('./Bus'),
	Broker : require('./Broker'),
	Bus : require('./Bus'),
	Cache : require('./Cache'),
	Class : require('./Class'),
	Connection : require('./Connection'),
	Exchange : require('./Exchange'),
	Logging : require('./Logging'),
	Pool : require('./Pool'),
	Process : require('./Process'),
	Processor : require('./Processor'),
	Register : require('./Register'),
	Request : require('./Request'),
	Response : require('./Response'),
	SocketServer : require('./SocketServer'),
	Stream : require('./Stream'),
	Transport : require('./Transport'),
	User : require('./User'),
	Utility : require('./Utility'),
	WebServer : require('./WebServer'),
	
	configure : function(properties) {
		
		var buses = properties.buses;
		console.log('buses.length: ' + buses.length);
	},
	
	connect : function(properties) {
		
		var result = null;
		var bus = new godsend.Bus({
			address : properties.address
		});
		var connection = bus.connect({
			credentials : properties.credentials,
		});
		result = connection;
		return result;
	},
	
	mount : function(properties) {
		
		var service = new properties.service({
			connection : properties.connection
		});
		service.mount(properties.connection);
		return service;
	},
	
	unmount : function(properties) {
		
		
	}
};
