Cache = module.exports = Class.extend({

	initialize: function(properties) {

		Object.assign(this, properties);
		this.patterns = {};
	},

	cache: function(pattern, processors) {

		this.put(pattern, processors);
	},

	put: function(pattern, processors) {

		var key = JSON.stringify(pattern, Object.keys(pattern).sort())
		this.patterns[key] = processors;
	},

	get: function(pattern) {

		var key = JSON.stringify(pattern, Object.keys(pattern).sort())
		return this.patterns[key];
	}
});
