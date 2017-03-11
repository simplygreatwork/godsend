
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
		this.sortReceiversByVersion(this.receivers);
		this.checkConflicts();
	},
	
	getReceivers : function(versions) {
		
		var result = null;
		versions = versions || {};
		var key = godsend.Utility.stringify(versions);
		if (this.cache[key]) {
			result = this.cache[key];
		} else {
			result = this.assembleReceivers(versions);
			this.cache[key] = result;
		}
		return result;
	},
	
	assembleReceivers : function(versions) {
		
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
		this.sortReceiversByExecution(result);
		return result;
	},
	
	sortReceiversByVersion : function(receivers) {						// should be sorted by id, then version ascending
		
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
	
	sortReceiversByExecution : function(receivers) {
		
		receivers.sort(function(a, b) {
			if (a.before) {
				if (this.findReceiver(receivers, a.before) == b) {
					return 1;
				}
			} else if (a.after) {
				if (this.findReceiver(receivers, a.after) == b) {
					return -1;
				}
			}
			return a.weight > b.weight;
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
	
	checkConflicts : function() {
		
		var conflicts = [];
		var previous = null;
		this.receivers.forEach(function(each) {
			if ((previous) && (previous.id + previous.version == each.id + each.version)) {
				conflicts.push(each.id);
			}
			previous = each;
		}.bind(this));
		if (conflicts.length > 0) {
			console.error('Error: The receiver list contains versioning conflicts: ' + JSON.stringify(conflicts, null, 2));
			process.exit();
		}
	}
});

};
