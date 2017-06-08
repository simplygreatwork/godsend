
cache = module.exports = {
	
	Processor: Class.extend({
		
		initialize: function(properties) {
			
			Object.assign(this, properties);
			this.cache = {};
		},
		
		cache: function(versions, pattern, processors) {
			
			this.put(versions, pattern, processors);
		},
		
		put: function(versions, pattern, processors) {
			
			versions = versions || {};
			var key = this.key(versions) + this.key(pattern);
			this.cache[key] = processors;
		},
		
		get: function(versions, pattern) {
			
			versions = versions || {};
			var key = this.key(versions) + this.key(pattern);
			return this.cache[key];
		},
		
		key : function(object) {
			
			return JSON.stringify(object, Object.keys(object).sort())
		}
	}),
	
	Connection: Class.extend({
		
		initialize: function(properties) {
			
			Object.assign(this, properties);
			this.cache = {};
		},
		
		put: function(pattern, connections) {
			
			var key = this.key(pattern);
			this.cache[key] = connections;
		},
		
		get: function(pattern) {
			
			var key = this.key(pattern);
			return this.cache[key];
		},
		
		key : function(object) {
			
			return JSON.stringify(object, Object.keys(object).sort())
		}
	})
};
