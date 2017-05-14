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
			var has = true;
			if (arguments[0].has) {
				arguments[0].has.forEach(function(each) {
					if (! (each in this.pattern)) {
						has = false;
					}
				}.bind(this));
			}
			if (has && this.matches(arguments[0])) {
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
		
		var object = {};
		Object.keys(properties).forEach(function(key) {
			if (key != 'has') {
				object[key] = properties[key];
			}
		}.bind(this));
		return Utility.matchesProperties(this.pattern, object);
	},
	
	has : function(key) {
		
		var result = false;
		if (key in this.pattern) {
			result = true;
		}
		return result;
	}
});
