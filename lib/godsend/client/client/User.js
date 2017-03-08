
init = function() {

godsend.User = Class.extend({
	
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
	
	matches : function(pattern, patterns) {						// really need to study this in depth (all the limits)
		
		var result = false;
		patterns.forEach(function(each) {
			var match = true;
			for (var property in each) {
				if (each[property] != pattern[property]) {
					match = false;
				}
			}
			if (match === true) {
				result = true;
			}
		}.bind(this));
		return result;
	},
	
	matchesStrictly : function(pattern, patterns) {
		
		var result = false;
		var string = JSON.stringify(pattern);
		patterns.forEach(function(each) {
			if (JSON.stringify(each) == string) {
				result = true;
			}
		}.bind(this));
		return result;
	}
});

};
