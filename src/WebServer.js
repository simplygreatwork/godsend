var Logger = require('js-logger');
var godsend = require('./main-node');

WebServer = module.exports = Class.extend({

	start: function(callback) {
		
		var Express = require('express');
		var express = Express();
		if (this.options && this.options.cert && this.options.key) {
			Logger.get('server').info('Starting server in HTTPS mode.');
			this.server = require('https').createServer(this.options, express);
		} else {
			Logger.get('server').info('Starting server in HTTP mode.');
			this.server = require('http').createServer(express);
		}
		this.server.listen(process.env.PORT || 8080, process.env.IP);
		console.log('Listening on port ' + process.env.PORT);
		callback(express);
	}
});
