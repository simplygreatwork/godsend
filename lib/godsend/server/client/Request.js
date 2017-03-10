
init = function() {

godsend.Request = Class.extend({
	
	initialize : function(properties) {
		
		Object.assign(this, properties);
		this.cachables = [];
		this.index = -1;
	},
	
	next : function() {
		
		this.index++;
		if (this.index < this.receivers.length) {
			this.receiver = this.receivers[this.index];
			this.receiver.on(this, this.response);
		} else {
			if (this.cachables !== null) {
				this.cache.put(this.pattern, this.cachables);
			}
			var errors = [];
			if (this.response.error) {
				errors = [this.response.error];
			}
			this.response.respond({
				value : this.response.data,
				errors : errors,
				final : true
			});
		}
	},
	
	start : function() {
		
		this.next();
	},
	
	accept : function() {
		
		Logger.get('request').info('Receiver matched: ' + this.receiver.id + ' (' + this.receiver.weight + ')');
		if (this.receiver.cache === false) {
			this.cachables = null;
		} else {
			if (this.cachables !== null) {
				this.cachables.push(this.receiver);
			}
		}
		this.receiver.run(this, this.response);
	},
	
	skip : function() {
		
		this.next();
	},
	
	end : function() {
		
		this.cachables = null;										// only allow receiver caching if the request was not ended early
		this.index = this.receivers.length;						// in the future pre-qualify, then cache
		this.next();
	},
	
	cancel : function() {
		
		this.end();
	},
	
	matches : function(properties) {
		
		return godsend.Utility.matchesProperties(this.pattern, properties);
	}
});

godsend.CachedRequest = Class.extend({							// will also need to account per version and per user
	
	initialize : function(properties) {
		
		Object.assign(this, properties);
		this.index = -1;
	},
	
	next : function() {
		
		this.index++;
		if (this.index < this.receivers.length) {
			this.receiver = this.receivers[this.index];
			this.accept();
		} else {
			var errors = [];
			if (this.response.error) {
				errors = [this.response.error];
			}
			this.response.respond({
				value : this.response.data,
				errors : errors,
				final : true
			});
		}
	},
	
	start : function() {
		
		this.next();
	},
	
	accept : function() {
		
		Logger.get('request').info('Cached matched: ' + this.receiver.id + ' (' + this.receiver.weight + ')');
		this.receiver.run(this, this.response);
	},
	
	skip : function() {
		
		this.next();
	},
	
	end : function() {
		
		this.index = this.receivers.length;
		this.next();
	},
	
	cancel : function() {
		
		this.end();
	},
	
	matches : function(properties) {
		
		return godsend.Utility.matchesProperties(properties, this.pattern);
	}
});

godsend.VersionedRequest = Class.extend({
	
	initialize : function(properties) {
		
		Object.assign(this, properties);
		this.cachables = [];
		this.index = -1;
	},
	
	next : function() {
		
		this.index++;
		if (this.index < this.receivers.length) {
			this.receiver = this.receivers[this.index];
			this.receiver.on(this, this.response);
		} else {
			if (this.cachables !== null) {
				this.cache.put(this.pattern, this.cachables);
			}
			var errors = [];
			if (this.response.error) {
				errors = [this.response.error];
			}
			this.response.respond({
				value : this.response.data,
				errors : errors,
				final : true
			});
		}
	},
	
	start : function() {
		
		this.next();
	},
	
	accept : function() {
		
		Logger.get('request').info('Receiver matched: ' + this.receiver.id + ' (' + this.receiver.weight + ')');
		if (this.receiver.cache === false) {
			this.cachables = null;
		} else {
			if (this.cachables !== null) {
				this.cachables.push(this.receiver);
			}
		}
		this.receiver.run(this, this.response);
	},
	
	skip : function() {
		
		this.next();
	},
	
	end : function() {
		
		this.cachables = null;										// only allow receiver caching if the request was not ended early
		this.index = this.receivers.length;						// in the future pre-qualify, then cache
		this.next();
	},
	
	cancel : function() {
		
		this.end();
	},
	
	matches : function(properties) {
		
		return godsend.Utility.matchesProperties(this.pattern, properties);
	}
});

};
