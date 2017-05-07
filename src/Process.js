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
				response: this.response
			})
		}.bind(this));
		if (this.processors.length === 0) {
			this.processors.push(new Processor({
				process: function(stream) {
					stream.push(stream.object);
					stream.next();
				}
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

	end: function() {

		this.processors[0].end();
	}
});
