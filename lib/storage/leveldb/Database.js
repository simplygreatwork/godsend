
var Class = require('./Class.js');
var Utility = require('./Utility.js');
var level = require('level');
var uuid = require('node-uuid');

Database = module.exports = Class.extend({
	
	initialize: function(properties) {
		
		this.BEGIN = '\x00';
		this.END = '\xff';
		this.path = properties.path;
	},
	
	initializeDatabase: function(properties) {
		
		if (properties.destroy) {
			this.destroy(function() {
				this.createDatabase();
				properties.callback();
			}.bind(this));
		} else {
			this.createDatabase();
			properties.callback();
		}
	},
	
	createDatabase: function() {
		
		this.database = level(this.path, {
			valueEncoding: 'json'
		});
	},

	createKey: function(properties) {

		var key = {
			namespace: 'shared',
			collection: 'default',
			id: uuid.v4()
		};
		if (properties) {
			Utility.merge(properties, key);
		}
		return [key.namespace, key.collection, key.id].join(this.BEGIN);
	},
	
	create: function(properties) {
		
		var key = this.createKey(properties);
		properties.value.id = key.split('\x00').pop();
		this.database.put(key, properties.value, function(error) {
			if (properties.callback) {
				properties.callback({
					result: properties.value,
					error: null
				});
			}
		});
	},

	update: function(properties) {

		var key = this.createKey(properties);
		this.database.put(key, properties.value, function(error) {
			if (properties.callback) {
				properties.callback({
					result: properties.value,
					error: null
				});
			}
		});
	},

	del: function(properties) {

		var key = this.createKey(properties);
		this.database.del(key, function(error) {
			if (properties.callback) {
				properties.callback({
					error: null
				});
			}
		});
	},

	put: function(properties) {

		this.database.put(properties.key, properties.value, function(error) {
			this.checkError(error);
			if (properties.callback) {
				properties.callback({
					result: properties.value,
					error: error
				});
			}
		}.bind(this));
	},

	patch: function(properties) {

		if (false) {
			this.database.put(properties.key, properties.value, function(error) {
				this.checkError(error);
				if (properties.callback) {
					properties.callback({
						result: properties.value,
						error: error
					});
				}
			}.bind(this));
		}
	},

	get: function(properties) {
		
		this.database.get(properties.key, function(error, value) {
			this.checkError(error);
			if (properties.callback) {
				properties.callback({
					error: error,
					value: value
				});
			}
		}.bind(this));
	},

	getEvery: function(properties) {

		var result = [];
		var readStream = this.database.createReadStream({
			keys: true,
			values: true,
			start: properties.namespace + this.BEGIN,
			end: properties.namespace + this.END
		});
		readStream
			.on('data', function(data) {
				result.push(data);
			})
			.on('error', function(error) {
				console.error(error);
			})
			.on('close', function() {
				properties.callback({
					result: result,
					error: null
				});
			})
			.on('end', function() {
				return;
			});
	},

	deleteEvery: function(properties) {

		this.getEvery({
			namespace: properties.namespace,
			callback: function(response) {
				response.result.forEach(function(each) {
					each.type = 'del';
				});
				this.database.batch(response.result, function(error) {
					this.checkError(error);
					properties.callback();
				}.bind(this));
			}.bind(this)
		});
	},

	batch: function(properties) {

		properties.operations.forEach(function(each) {
			each.key = [properties.namespace, properties.collection, each.key].join(this.BEGIN);
		}.bind(this));
		this.database.batch(properties.operations, function(error) {
			this.checkError(error);
			properties.callback();
		}.bind(this));
	},

	getRange: function(properties) {

		var array = [];
		array.push(properties.namespace);
		array.push(this.BEGIN);
		var prefix = array.join('');
		var start = prefix + properties.begin;
		var end = prefix + properties.end;
		if (false) console.log('start: ' + start);
		if (false) console.log('end: ' + end);
		var readStream = this.database.createReadStream({
			keys: true,
			values: true,
			start: start,
			end: end
		});
		var result = [];
		readStream
			.on('data', function(data) {
				result.push(data);
			}.bind(this))
			.on('error', function(error) {
				console.log('readStream error: ', error);
			}.bind(this))
			.on('close', function() {
				if (false) console.log('Stream closed.');
			}.bind(this))
			.on('end', function() {
				if (false) console.log('Stream ended.');
				properties.callback(result);
			}.bind(this));
	},

	purgeRange: function(properties) {

		var array = [];
		array.push(properties.namespace);
		array.push(this.BEGIN);
		var prefix = array.join('');
		var start = prefix + properties.begin;
		var end = prefix + properties.end;
		var readStream = this.database.createReadStream({
			keys: true,
			values: false,
			start: start,
			end: end
		});
		var result = [];
		readStream
			.on('data', function(data) {
				result.push(data);
			}.bind(this))
			.on('error', function(error) {
				console.log('Read stream error:  ', error);
			}.bind(this))
			.on('close', function() {
				if (false) console.log('Stream closed.');
				this.deleteRange(result, properties.callback);
			}.bind(this))
			.on('end', function() {
				if (false) console.log('Stream ended.');
			}.bind(this));
	},

	deleteRange: function(keys, callback) {

		var operations = [];
		keys.forEach(function(key) {
			operations.push({
				type: 'del',
				key: key,
			});
		});
		this.database.batch(operations, function(error) {
			this.checkError(error);
			callback(keys.length);
		});
	},

	iterate: function() {

		console.log('iterate');
		this.database.createReadStream()
			.on('data', function(data) {
				console.log(data.key, ': ', data.value);
			})
			.on('error', function(error) {
				console.log('Read stream error:  ', error);
			})
			.on('close', function() {
				if (false) console.log('Stream closed.');
			})
			.on('end', function() {
				if (false) console.log('Stream ended.');
			});
	},

	getLastKey: function() {

		this.lastKey = null;
		var readStream = this.database.createReadStream({
			limit: 1,
			reverse: true,
			keys: true,
			values: false
		});
		readStream
			.on('data', function(data) {
				if (false) console.log('data: ' + data);
				readStream.pause();
				readStream.destroy();
				this.lastKey = data;
			}.bind(this))
			.on('error', function(error) {
				console.log('Read stream error:  ', error);
			}.bind(this))
			.on('close', function() {
				if (false) console.log('Stream closed.');
				callback(this.lastKey);
			}.bind(this))
			.on('end', function() {
				if (false) console.log('Stream ended.');
			}.bind(this));
	},
	
	checkError: function(error) {
		
		if (error) {
			console.error(error);
			return true;
		} else {
			return false;
		}
	},

	destroy: function(callback) {

		level.destroy(this.path, function(error) {
			if (error) {
				console.log('Error destroying database.');
			} else {
				console.log('Destroyed database.');
			}
			callback();
		}.bind(this));
	}

});
