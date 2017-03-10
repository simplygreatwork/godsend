
init = function() {

window.Logger = {
	
	ready : function(callback) {
		
		if (window.console_ === undefined) {
			window.console_ = new godsend.Console();
		}
		window.console_.start(callback);
	},
	
	get : function(name) {
		
		return window.console_.get(name);
	}
};

godsend.Console = Class.extend({
	
	initialize : function(properties) {
		
		Object.assign(this, properties);
		this.log = [];
		this.consoles = [];
		this.views = {};
	},
	
	start : function(callback) {
		
		var self = this;
		riot.compile(function() {
			document.querySelector('body').appendChild(document.createElement('console-view'));
			var tags = riot.mount('*');
			self.views.console = tags[0];
			if (! self.views.console) {
				console.log('The console view tag could not be loaded.');
			}
			callback();
		});
	},
	
	get : function(name) {
		
		var console = this.find(name);
		if (! console) {
			console = new godsend.NamedConsole({
				name : name,
				index : this.consoles.length,
				console : this
			});
			this.consoles.push(console);
		}
		this.log.forEach(function(each) {
			var messages = each.messages;
			for (var i = messages.length; i < this.consoles.length; i++) {
				messages.push('');
			}
		}.bind(this));
		return console;
	},
	
	find : function(name) {
		
		var result = null;
		this.consoles.forEach(function(each) {
			if (each.name == name) {
				result = each;
			}
		});
		return result;
	}
});

godsend.NamedConsole = Class.extend({
	
	initialize : function(properties) {
		
		Object.assign(this, properties);
	},
	
	log : function(object) {
		
		var messages = [];
		for (var i = 0; i < this.console.consoles.length; i++) {
			messages.push('');
		}
		messages[this.index] = object;
		this.console.log.push({
			messages : messages,
			sender : this.name
		});
		console.log('[' + this.name + '] ' + object);
		this.console.views.console.update();
	}
});

};
