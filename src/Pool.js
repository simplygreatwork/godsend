var Class = require('./Class');

Pool = module.exports = Class.extend({

	initialize: function(properties) {

		Object.assign(this, properties);
	}
});
