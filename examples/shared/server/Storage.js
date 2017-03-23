var fs = require('fs');

Storage = module.exports = Class.extend({

	initialize: function(properties) {

		Object.assign(this, properties);
		if (this.users) {
			this.data = {
				users: this.users
			};
			delete this.users;
		}
		this.load(function(data) {
			var users = data.users;
			Object.keys(users).forEach(function(key) {
				this.data.users[users[key].credentials.username] = users[key];
			}.bind(this));
		}.bind(this));
	},

	put: function(properties) {

		this.data.users[properties.key] = properties.value;
		properties.callback({
			error: null
		});
		this.save();
	},

	get: function(properties) {

		var value = this.data.users[properties.key];
		properties.callback({
			error: null,
			value: value
		});
	},

	save: function() {

		fs.writeFileSync('data.json', JSON.stringify(this.data, null, 2));
	},

	load: function(callback) {

		var result = {
			users: {}
		};
		var path = 'data.json';
		if (fs.existsSync(path)) {
			var string = fs.readFileSync(path);
			if (string) {
				try {
					var object = JSON.parse(string);
					result = object;
				} catch (e) {
					console.error('Could not parse data JSON string.')
				}
			}
		}
		callback(result);
	}
});
