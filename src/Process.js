var Class = require('./Class');
var Processor = require('./Processor');

Process = module.exports = Class.extend({
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
		this.assemble();
	},
	
	assemble: function() {
		
		this.processors.forEach(function(each, index) {
			this.processors[index] = new Processor({
				id: each.id,
				weight: each.weight,
				process: each.run,
				ending: each.ending,
				errors: this.streams.error,
				request: this.request,
				response: this.response,
				connection: this.connection
			})
		}.bind(this));
		if (this.processors.length === 0) {
			this.processors.push(new Processor({
				weight: 0,
				process: function(stream) {
					stream.push(stream.object);
					stream.next();
				},
				errors: this.streams.error,
				request: this.request,
				response: this.response,
				connection: this.connection
			}));
		}
		this.processors.push(this.streams.main);
		this.processors.forEach(function(each, index) {
			if (index > 0) {
				this.processors[index - 1].pipe(this.processors[index])
			}
		}.bind(this));
	},

	write: function(data) {

		this.processors[0].write(data);
	},

	err: function(data) {
		
		this.processors[0].errors.write(data);
	},

	end: function() {
		
		this.processors[0].end();
		this.processors[0].errors.end();
	}
});
