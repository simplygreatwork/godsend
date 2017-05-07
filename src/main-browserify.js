
module.exports = {
	Bus : require('./Bus'),
	Class : require('./Class'),
	// Logger : require('js-logger'),
	uuid : require('uuid/v4'),
	
	configure : function(properties) {
		
		var buses = properties.buses;
		if (false) console.log('buses.length: ' + buses.length);
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
	}
};
