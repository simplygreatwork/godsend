
var fs = require('fs');

Server = module.exports = Class.extend({
	
	initialize : function(properties) {
	   
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
      this.server.web.start(function() {
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
