var Class = require('./Class');

Response = module.exports = Class.extend({

	initialize: function(properties) {

		Object.assign(this, properties);
	}
});
