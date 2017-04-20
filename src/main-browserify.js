
module.exports = {
	Bus : require('./Bus'),
	Class : require('./Class'),
	// Logger : require('js-logger'),
	uuid : require('uuid/v4'),
	
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
	},
	
	unmount : function(properties) {
		
		
	}
};
