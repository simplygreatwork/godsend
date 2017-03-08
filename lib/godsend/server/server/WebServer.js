
init = function() {

var path = require('path');
var fs = require('fs');
var serveIndex = require('serve-index');

Logger = require('js-logger');
Logger.useDefaults();
Logger.setLevel(Logger.INFO);

godsend.WebServer = Class.extend({
	
	start : function(callback) {
   	
		var express = require('express');
		var app = express();
		var string = path.join(process.env.PWD, '../../../');
		app.use('/', express.static(string));
		string = path.join(process.env.PWD, '../../examples');
		app.use('/godsend/examples', serveIndex(string, {
			'icons': true
		}));
		if (this.options && this.options.cert && this.options.key) {
			Logger.get('server').info('Starting server in HTTPS mode.');
			this.server = require('https').createServer(this.options, app);
		} else {
			Logger.get('server').info('Starting server in HTTP mode.');
			this.server = require('http').createServer(app);
		}
		this.server.listen(8080, process.env.IP);
		callback();
	}
});

};
