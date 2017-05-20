var toposort = require('toposort');
var uuid = require('uuid/v4');
var Class = require('./Class');
var Utility = require('./Utility');

Register = module.exports = Class.extend({
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
		this.processors = [];
		this.cache = {};
	},
	
	addProcessor: function(processor) {
		
		this.ensureProcessor(processor);
		this.processors.push(processor);
		this.sortProcessorsByVersion(this.processors);
		this.checkConflicts();
		this.cache = {}; // important: MUST invalidate any cached processors when adding
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
		var key = Utility.stringify(versions);
		if (this.cache[key]) {
			result = this.cache[key];
		} else {
			result = this.assembleProcessors(versions);
			this.cache[key] = result;
		}
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
	
	sortProcessorsByExecution: function(processors) { // review this entire algorithm, specifically the re-insertion of befores/afters
		
		processors.forEach(function(each, index) {	// modifications to weights, etc must apply only to this request
			each._before = each.before || undefined;
			each._after = each.after || undefined;
			each._weight = each.weight;
		}.bind(this));
		processors.forEach(function(each, index) { // if a processor references "before", set it's weight to zero
			if (each._before || each._after) each._weight = 0;
		}.bind(this));
		processors.sort(function(a, b) { // sort by weights
			return a._weight - b._weight;
		}.bind(this));
		processors.forEach(function(each, index) {	// now substitute afters for weights to toposort instead
			if (index > 0) {
				if (each._after === undefined && each._before === undefined) {	// added each.before condition: a major review of toposort library cyclic dependency issues is needed
					each._after = processors[index - 1].id
				}
			}
		}.bind(this));
		var graph = [];
		processors.forEach(function(each) {
			if (each._before) {
				graph.push([each, this.findProcessor(processors, each._before)]);
			}
			if (each._after) {
				graph.push([this.findProcessor(processors, each._after), each]);
			}
		}.bind(this));
		if (false) this.printGraph(graph);
		var selection = toposort(graph); // only sort "befores/afters" by themselves
		selection.forEach(function(each) { // else potential for cyclic hell
			var index = processors.indexOf(each); // issue: consider ensuring that all "before/after" ref weights are identical
			if (index > -1) processors.splice(index, 1);
		}.bind(this));
		var result = [];
		if (processors.length > 0) {
			for (var i = 0; i < processors.length; i++) { // and then reinsert the "befores/afters" back into the list
				this.getMatchingWeights(selection, processors[i]._weight).forEach(function(each) {
					result.push(each);
				}.bind(this));
				result.push(processors[i]);
			}
		} else {
			result = selection;
		}
		return result;
	},
	
	printGraph : function(graph) {
		
		graph.forEach(function(each) {
			console.log('[' + each[0].id + ', ' + each[1].id +  ']');
		}.bind(this));
		if (false) console.log('graph: ' + JSON.stringify(graph, null, 2));
	},
	
	getMatchingWeights: function(selection, weight) {
		
		var result = [];
		for (var i = selection.length - 1; i >= 0; i--) {
			if (selection[i]._weight == weight) {
				var select = selection.splice(i, 1);
				result.unshift(select[0]);
			}
		}
		return result;
	},
	
	getProcessor: function(id) {
		
		return this.findProcessor(this.processors, id);
	},
	
	findProcessor: function(processors, ids) {
		
		var result = null;
		if (! (ids instanceof Array)) {
			ids = [ids];
		}
		ids.forEach(function(id) {
			if (result === null) {
				processors.forEach(function(each) {
					if (each.id == id) {
						result = each;
					}
				});
			}
		});
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