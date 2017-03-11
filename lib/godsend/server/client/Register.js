
init = function() {

godsend.Register = Class.extend({
	
	initialize : function(properties) {
		
		Object.assign(this, properties);
		this.receivers = [];
		this.cache = {};
	},
	
	addReceiver : function(receiver) {
		
		receiver.id = receiver.id || uuid.v4();
		receiver.weight = receiver.weight || 0;
		receiver.version = receiver.version || 1;
		this.receivers.push(receiver);
		this.sortAllReceivers(this.receivers);
	},
	
	getReceivers : function(versions) {
		
		var result = null;
		versions = versions || {};
		var key = godsend.Utility.stringify(versions);
		if (this.cache[key]) {
			result = this.cache[key];
		} else {
			result = this.buildReceivers(versions);
			this.cache[key] = result;
		}
		return result;
	},
	
	buildReceivers : function(versions) {
		
		var result = [];
		var previous = null;
		var version = {
			current : null,
			applied : null
		};
		this.receivers.forEach(function(each) {
			if (previous == null) {
				result.push(each);
				version.applied = null;
			} else if (previous.id != each.id) {
				result.push(each);
				version.applied = null;
			}
			version.current = versions[each.id];
			if ((version.current) && (each.version == version.current)) {
				result[result.length - 1] = each;
				version.applied = version.current;
			}
			if ((version.applied == null) && (each.default === true)) {
				result[result.length - 1] = each;
			}
			previous = each;
		}.bind(this));
		this.resolveWeights(result);
		this.sortReceivers(result);
		return result;
	},
	
	sortAllReceivers : function(receivers) {					// should be sorted by id, then version ascending
		
		receivers.sort(function(a, b) {
			var aa = a['id'] + a['version'];
			var bb = b['id'] + b['version'];
			if (aa > bb) {
				return 1;
			} else if (aa < bb) {
				return -1;
			} else {
				return 0;
			}
		});
	},
	
	sortReceivers : function(receivers) {
		
		receivers.sort(function(a, b) {
			return a.weight < b.weight;
		});
	},
	
	resolveWeights : function(receivers) {								// actually need to value adjustent to be in the middle
		
		receivers.forEach(function(each) {
			if (each.before) {
				var receiver = this.findReceiver(receivers, each.before);
				if (receiver) {
					each.weight = receiver.weight - 0.1;
				}
			}
			if (each.after) {
				var receiver = this.findReceiver(receivers, each.after);
				if (receiver) {
					each.weight = receiver.weight + 0.1;
				}
			}
		}.bind(this));
	},
	
	findReceiver : function(receivers, id) {
		
		var result = null;
		receivers.forEach(function(each) {
			if (each.id == id) {
				result = each;
			}
		});
		return result;
	},
});

};
