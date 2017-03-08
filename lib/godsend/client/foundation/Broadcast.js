
init = function() {
	
Broadcast = {
	
	channels: {},
	
	subscribe: function(key, handler) {
   	
		var channels = Broadcast.channels;
		if (channels[key] == null) {                                                  // why does this break with === ?
			channels[key] = [];
		}
		channels[key].push(handler);
    
		return {
			channel: channels[key],
			handler: handler
		};
	},
	
	unsubscribe: function(key, handler) {
    
		var channels = Broadcast.channels;
		var subscribes = channels[key];
		if (subscribes) {
			var index = subscribes.length;
			while (index--) {
				if (subscribes[index] == handler) {
					subscribes.splice(index, 1);
				}
			}
		}
	},
	
	publish: function(key, data) {
   	
		var channels = Broadcast.channels;
		var subscribes = [];
		var channel = channels[key];
		if (channel) {
			subscribes = channel;
		}
		var index = subscribes.length;
		while (index--) {
			var object = [];
			if (data) {
				object = data;
			}
			subscribes[index].apply(Broadcast, [object]);
		}
	}
};
	
};
