
init = function() {

godsend.Cache = Class.extend({
	
	initialize : function(properties) {
		
		Object.assign(this, properties);
		this.patterns = {};
	},
	
	cache : function(pattern, receivers) {
		
		this.put(pattern, receivers);
	},
	
	put : function(pattern, receivers) {
		
		var key = JSON.stringify(pattern, Object.keys(pattern).sort())
		this.patterns[key] = receivers;
	},
	
	get : function(pattern) {
		
		var key = JSON.stringify(pattern, Object.keys(pattern).sort())
		return this.patterns[key];
	}
});

};
