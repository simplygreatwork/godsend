var Class = require('./Class');

Receiver = module.exports = Class.extend({

	initialize: function(properties) {
		
		Object.assign(this, properties);
		this.register = new Register({name : 'rebound'});
	},
	
	receive: function(request, streams) {
		
		this.connection.getProcess(this.register, request, streams, function(process) {
			streams.main.on('end', function() {
				process.end();
			}.bind(this));
			streams.main.on('readable', function() {
				var value = streams.main.read();
				if (value) {
					process.write(value);
				}
			}.bind(this));
		}.bind(this));
	},
});
