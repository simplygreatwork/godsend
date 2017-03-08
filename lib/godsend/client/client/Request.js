
init = function() {
	
godsend.Request = Class.extend({
	
	initialize : function(properties) {
		
		Object.assign(this, properties);
	},
	
	next : function() {
		
		if (this.receivers.length > 0) {
			this.receiver = this.receivers.shift();
			this.receiver.on(this, this.response);
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
		
		if (true) console.log('receiver.accepted: ' + this.receiver.id + ' (' + this.receiver.weight + ')');
		this.receiver.run(this, this.response);
	},
	
	skip : function() {
		
		this.next();
	},
	
	end : function() {
		
		this.receivers.splice(0, this.receivers.length);
		this.next();
	},
	
	cancel : function() {
		
		this.end();
	},
	
	matches : function(properties) {
		
		var result = true;
		var property = null;
		for (property in properties) {
			if (this.pattern[property] != properties[property]) {
				result = false;
			}
		}
		return result;
	}
});
	
};
