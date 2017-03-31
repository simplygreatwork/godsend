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
		var port = process.env.PORT || 8080;
		this.server.listen(port, process.env.IP);
		console.log('Listening on port ' + port + '.');
		callback(express);
	}
});
