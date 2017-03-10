
init = function() {

godsend.Request = Class.extend({
	
	initialize : function(properties) {
		
		Object.assign(this, properties);
		this.accepted = [];
		this.index = -1;
	},
	
	next : function() {
		
		this.index++;
		if (this.index < this.receivers.length) {
			this.receiver = this.receivers[this.index];
			this.receiver.on(this, this.response);
		} else {
			if (this.accepted !== null) {
				this.cache.put(this.pattern, this.accepted);
			}
			this.response.respond({
				result : this.response.data,
				error : this.response.error
			});
		}
	},
	
	start : function() {
		
		this.next();
	},
	
	accept : function() {
		
		Logger.get('request').info('Receiver matched: ' + this.receiver.id + ' (' + this.receiver.weight + ')');
		if (this.receiver.cache === false) {
			this.accepted = null;
		} else {
			if (this.accepted !== null) {
				this.accepted.push(this.receiver);
			}
		}
		this.receiver.run(this, this.response);
	},
	
	skip : function() {
		
		this.next();
	},
	
	end : function() {
		
		this.accepted = null;										// only allow receiver caching if the request was not ended early
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

godsend.CachedRequest = Class.extend({
	
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
			this.response.respond({
				result : this.response.data,
				error : this.response.error
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

};
