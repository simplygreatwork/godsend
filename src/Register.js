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
		result = this.sortProcessorsByExecution(result);
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

	sortProcessorsByExecution: function(processors) { // rethink this entire algorithm
		// specifically the re-insertion of befores/afters
		processors.forEach(function(each, index) { // if a processor references "before", set it's weight to zero
			if (each.before || each.after) each.weight = 0;
		}.bind(this));
		processors.sort(function(a, b) { // sort by weights
			return a.weight - b.weight;
		}.bind(this));
		var graph = [];
		processors.forEach(function(each, index) {
			if (each.before) {
				graph.push([each, this.findProcessor(processors, each.before)]);
			} else if (each.after) {
				graph.push([this.findProcessor(processors, each.after), each]);
			}
		}.bind(this));
		var selection = toposort(graph); // only sort "befores/afters" by themselves
		selection.forEach(function(each) { // else potential for cyclic hell
			var index = processors.indexOf(each); // issue: consider ensuring that all "before/after" ref weights are identical
			if (index > -1) processors.splice(index, 1);
		}.bind(this));
		var result = [];
		if (processors.length > 0) {
			for (var i = 0; i < processors.length; i++) { // and then reinsert the "befores/afters" back into the list
				this.getMatchingWeights(selection, processors[i].weight).forEach(function(each) {
					result.push(each);
				}.bind(this));
				result.push(processors[i]);
			}
		} else {
			result = selection;
		}
		return result;
	},

	getMatchingWeights: function(selection, weight) {

		var result = [];
		for (var i = selection.length - 1; i >= 0; i--) {
			if (selection[i].weight == weight) {
				var select = selection.splice(i, 1);
				result.unshift(select[0]);
			}
		}
		return result;
	},

	findProcessor: function(processors, id) {

		var result = null;
		processors.forEach(function(each) {
			if (each.id == id) {
				result = each;
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
