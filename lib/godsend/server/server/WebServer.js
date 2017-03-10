
init = function() {

Logger = require('js-logger');
Logger.useDefaults();
Logger.setLevel(Logger.INFO);

godsend.WebServer = Class.extend({
	
	start : function(callback) {
   	
		var Express = require('express');
		var express = Express();
		if (this.options && this.options.cert && this.options.key) {
			Logger.get('server').info('Starting server in HTTPS mode.');
			this.server = require('https').createServer(this.options, express);
		} else {
			Logger.get('server').info('Starting server in HTTP mode.');
			this.server = require('http').createServer(express);
		}
		this.server.listen(8080, process.env.IP);
		callback(express);
	}
});

};
