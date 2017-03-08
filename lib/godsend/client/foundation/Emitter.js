init = function() {
	
/* From https://gist.github.com/mudge/5830382 */
/* I haven't used or tested this yet and will likely refactor and rename */
/* Plan to use this for listening to events pertaining to the connection to the bus */

var indexOf;
if (typeof Array.prototype.indexOf === 'function') {
	indexOf = function(haystack, needle) {
		return haystack.indexOf(needle);
	};
} else {
	indexOf = function(haystack, needle) {
		var i = 0;
		var length = haystack.length;
		var index = -1;
		var found = false;
		while (i < length && ! found) {
			if (haystack[i] === needle) {
				index = i;c
				found = true;
			}
			i++;
		}
		return index;
	};
};

var EventEmitter = function() {
	this.events = {};
};

EventEmitter.prototype.on = function(event, listener) {
	
	if (typeof this.events[event] !== 'object') {
		this.events[event] = [];
	}
	this.events[event].push(listener);
};

EventEmitter.prototype.removeListener = function(event, listener) {
	
	var index = null;
	if (typeof this.events[event] === 'object') {
		index = indexOf(this.events[event], listener);
		if (index > -1) {
			this.events[event].splice(index, 1);
		}
	}
};

EventEmitter.prototype.emit = function(event) {
	
	var i = null;
	var listeners = null;
	var length = null;
	var args = [].slice.call(arguments, 1);
	if (typeof this.events[event] === 'object') {
		listeners = this.events[event].slice();
		length = listeners.length;
		for (i = 0; i < length; i++) {
			listeners[i].apply(this, args);
		}
	}
};

EventEmitter.prototype.once = function(event, listener) {
	
	this.on(event, function g() {
		this.removeListener(event, g);
		listener.apply(this, arguments);
	});
};
	
};
