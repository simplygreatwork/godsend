
var fs = require('fs');
var path = require('path');
var Express = require('express');
Express.serveIndex = require('serve-index');

Server = module.exports = Class.extend({
	
	initialize : function(properties) {
	   
		Logger.setLevel(Logger.INFO);
		Logger.setLevel(Logger.OFF);
	   
      Object.assign(this, properties);
      if (this.secure) {
         this.options = {
            key : fs.readFileSync('/home/ubuntu/workspace/trust/server.key.private.pem'),
            cert : fs.readFileSync('/home/ubuntu/workspace/trust/server.cert.pem'),
            requestCert : false
         };
      }
	},
	
	start : function(callback) {
		
		console.log('Starting server.');
      this.server = {};
      this.server.web = new godsend.WebServer({
         options : this.options || {}
      });
      this.server.web.start(function(express) {
         express.use('/', Express.static(path.join(process.env.PWD, '../../../godsend')));
         express.use('/examples', Express.serveIndex(path.join(process.env.PWD, '../../examples'), {'icons': true}));
         this.server.socket = new godsend.SocketServer({
            server : this.server.web.server,
				exchange : this.exchange || new godsend.exchange.Secure({
               users : require('./users.json')
            })
         });
         this.server.socket.start(function() {
            callback();
         });
      }.bind(this));
   }
});
