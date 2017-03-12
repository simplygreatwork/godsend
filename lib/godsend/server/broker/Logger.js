
init = function() {

Logger = require('js-logger');
Logger.useDefaults();
Logger.setLevel(Logger.INFO);

godsend.Logger = Class.extend({
	
	initialize : function(properties) {
		
		Object.assign(this, properties);
	}
});

};
