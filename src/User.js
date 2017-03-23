
var Utility = require('./Utility');

User = module.exports = Class.extend({
	
	initialize : function(properties) {
		
		Object.assign(this, properties);
	},
	
	isSendable : function(pattern) {
		
		var result = false;
		if (this.matches(pattern, this.patterns.sendable)) {
			result = true;
		}
		return result;
	},
	
	isReceivable : function(pattern) {
		
		var result = false;
		if (this.matches(pattern, this.patterns.receivable)) {
			result = true;
		}
		return result;
	},
	
	addSendable : function(pattern) {
		
		this.addPattern(pattern, this.patterns.sendable);
	},
	
	addReceivable : function(pattern) {
		
		this.addPattern(pattern, this.patterns.receivable);
	},
	
	addPattern : function(key, pattern) {
		
		var result = false;
		var patterns = this.patterns[key];
		if (! this.exists(pattern, patterns)) {
			patterns.push(pattern);
			result = true;
		}
		return result;
	},
	
	exists : function(pattern, patterns) {
		
		var result = false;
		var string = Utility.stringify(pattern);
		patterns.forEach(function(each) {
			if (Utility.stringify(each) == string) {
				result = true;
			}
		}.bind(this));
		return result;
	},
	
	matches : function(pattern, patterns) {
		
		return Utility.matchesPartially(pattern, patterns);
	},
});
