var toposort = require('toposort');
var uuid = require('uuid/v4');
var Class = require('./Class');
var Utility = require('./Utility');

Register = module.exports = Class.extend({
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
		this.processors = [];
		this.cache = new Cache();
	},
	
	addProcessor: function(processor) {
		
		this.ensureProcessor(processor);
		this.processors.push(processor);
		this.sortProcessorsByVersion(this.processors);
		this.checkConflicts();
		this.cache = new Cache(); // important: MUST invalidate any cached processors when adding
	},
	
	removeProcessor: function(properties) {
		
		var result = null;
		for (var i = this.processors.length - 1; i >=0; i--) {
			var processor = this.processors[i];
			if (properties.version) {
				if (processor.id == properties.id && processor.version.name == properties.version) {
					result = this.processors.splice(i, 1)[0];
				}
			} else {
				if (processor.id == properties.id) {
					result = this.processors.splice(i, 1)[0];
				}
			}
		}
		return result;
	},
	
	modifyProcessor : function(properties) {
		
		var processor = this.removeProcessor(properties);
		if (processor) {
			Object.keys(properties).forEach(function(key) {
				processor[key] = properties[key];
			}.bind(this));
			this.addProcessor(processor);
		} else {
			console.warn('Could not locate processor to modify: ', properties.id);
		}
	},
	
	ensureProcessor: function(processor) {
		
		processor.id = Utility.ensure(processor.id, uuid());
		processor.weight = Utility.ensure(processor.weight, 0);
		if (typeof processor.version != 'object') {
			processor.version = {
				name: processor.version,
				'default': false
			}
		}
		processor.version.name = Utility.ensure(processor.version.name, ' unversioned ');
	},
	
	getProcessors: function(versions) {
		
		var result = null;
		versions = versions || {};
		result = this.assembleProcessors(versions);
		return result;
	},
	
	assembleProcessors: function(versions) {
		
		var result = [];
		var previous = null;
		var version = {
			current: null,
			applied: null
		};
		this.processors.forEach(function(each) {
			if (previous == null) {
				result.push(each);
				version.applied = null;
			} else if (previous.id != each.id) {
				result.push(each);
				version.applied = null;
			}
			version.current = versions[each.id];
			if ((version.current) && (each.version.name == version.current)) {
				result[result.length - 1] = each;
				version.applied = version.current;
			}
			if ((version.applied == null) && (each.version.default === true)) {
				result[result.length - 1] = each;
			}
			previous = each;
		}.bind(this));
		return result;
	},

	sortProcessorsByVersion: function(processors) { // should be sorted by id, then version ascending
		
		processors.sort(function(a, b) {
			var aa = a['id'] + a['version'].name;
			var bb = b['id'] + b['version'].name;
			if (aa > bb) {
				return 1;
			} else if (aa < bb) {
				return -1;
			} else {
				return 0;
			}
		});
	},
	
	sortProcessorsByExecution : function(all) {
		
		var src = all.slice(0, all.length);
		var dest = [{
			id : 'start',
			weight : -Number.MAX_VALUE
		}, {
			id : 'end',
			weight : Number.MAX_VALUE
		}];
		while (src.length > 0) {
			var object = src.shift();
			var index = this.insert(object, dest, all);
			if (index === -1) {
				src.push(object);
			}
		}
		return dest.slice(1, dest.length - 1);
	},
	
	insert : function(object, dest, all) {
		
		var index = -1;
		var stack = [];
		for (var i = 0; i < dest.length; i++) {
			var each = dest[i];
			var after = this.findID(object.after, all);
			var before = this.findID(object.before, all);
			if (after && before && (stack.indexOf(after) > -1) && (each.id == before)) {
				index = i;
				break;
			} else if ((after == each.id) && (before == null)) {
				index = i + 1;
				break;
			} else if ((before == each.id) && (after == null)) {
				index = i;
				break;
			} else if ((object.weight < each.weight) && (after == null) && (before == null)) {
				index = i;
				break;
			}
			stack.push(each.id);
		}
		if (index > -1) {
			dest.splice(index, 0, object);
		}
		return index;
	},
	
	findID : function(ids, all) {
		
		var result = null;
		if (ids instanceof Array) {
			ids.forEach(function(id) {
				all.forEach(function(each) {
					if ((result == null) && (each.id == id)) {
						result = id;
					}
				}.bind(this));
			}.bind(this));
		} else {
			result = ids;
		}
		return result;
	},
	
	checkConflicts: function() {
		
		var conflicts = [];
		var previous = null;
		this.processors.forEach(function(each) {
			if ((previous) && (previous.id + previous.version.name == each.id + each.version.name)) {
				conflicts.push(each.id);
			}
			previous = each;
		}.bind(this));
		if (conflicts.length > 0) {
			console.error('Error: The processor list contains versioning conflicts: ' + JSON.stringify(conflicts, null, 2));
			process.exit();
		}
	}
});