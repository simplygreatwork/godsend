
init = function() {

Logger = require('js-logger');

godsend.Server = Class.extend({
   
	initialize: function() {
      
		server = this;
		this.initializeConfiguration();
		this.initializeServer(function() {
		   Logger.getLogger('server').info('The server has been started.');
		}.bind(this));
	},
   
	initializeConfiguration: function() {
      
      config = require('minimist')(process.argv.slice(2), {
         default : {
            production : true,
            executable : false,
            port : 8080,
            secure : false,
            username : 'admin',
            passphrase : ''
         }
      });
   },
   
	initializeServer : function(callback) {
      
      this.server = {};
      this.server.web = new godsend.WebServer();
      this.server.web.start(function() {
         this.server.socket = new godsend.SocketServer({
            server : this.server.web.server
         });
         this.server.socket.start(function() {
            callback();
         });
      }.bind(this));
   }
});

};

