
init = function() {

Logger = require('js-logger');
Logger.useDefaults();
Logger.setLevel(Logger.INFO);
Logger.get('broker').setLevel(Logger.INFO);
Logger.get('exchange').setLevel(Logger.INFO);
Logger.get('bus').setLevel(Logger.INFO);
Logger.get('cache').setLevel(Logger.INFO);
Logger.get('connection').setLevel(Logger.INFO);
Logger.get('register').setLevel(Logger.INFO);
Logger.get('request').setLevel(Logger.INFO);
Logger.get('transport').setLevel(Logger.INFO);
Logger.get('server').setLevel(Logger.INFO);
Logger.get('server-web').setLevel(Logger.INFO);
Logger.get('server-socket').setLevel(Logger.INFO);

godsend.Logger = Class.extend({
	
	initialize : function(properties) {
		
		Object.assign(this, properties);
	}
});

};
