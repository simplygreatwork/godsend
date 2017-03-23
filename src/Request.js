var Class = require('./Class');
var Utility = require('./Utility');

Request = module.exports = Class.extend({

	initialize: function(properties) {

		Object.assign(this, properties);
		this.processors = [];
		this.index = -1;
		this.cacheable = true;
	},

	prepare: function(callback) {

		this.callback = callback;
		this.next();
	},

	next: function() {

		this.index++;
		if (this.index < this.candidates.length) {
			this.processor = this.candidates[this.index];
			if (this.processor.cache === false) {
				this.cacheable = false;
			}
			this.processor.on(this);
		} else {
			this.callback();
		}
	},

	accept: function() {

		if (arguments[0]) {
			if (this.matches(arguments[0])) {
				this.accept();
			} else {
				this.skip();
			}
		} else {
			this.processors.push(this.processor);
			this.next();
		}
	},

	skip: function() {

		this.next();
	},

	matches: function(properties) {

		return Utility.matchesProperties(this.pattern, properties);
	}
});
