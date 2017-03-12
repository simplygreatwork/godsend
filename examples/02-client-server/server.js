
require('../../lib/godsend/server/main.js').ready(function(godsend) {

var Bus = godsend.Bus;

Example = Class.extend({
	
	initialize : function(properties) {
		
		console.log('Starting server.');
		server = this;
		this.initializeServer(function() {
         var receiver = new Receiver();
         receiver.connect(function() {
	         console.log('Everything has been started.');
         });
		}.bind(this));
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

Receiver = Class.extend({
	
	initialize : function(properties) {
		
		Object.assign(this, properties);
	},
	
	connect : function(callback) {
		
		this.bus = new Bus({
			local : false
		});
		this.bus.connect({
			credentials : {
				username : 'client-receiver',
				passphrase : ''
			},
			responded : function(properties) {
				this.connection = properties.connection;
				this.receive();
				callback();
			}.bind(this)
		});
	},
	
	receive : function() {
		
		this.connection.receive({
			id : 'post-message',
			on : function(request, response) {
				if (request.matches({
					topic : 'post-message'
				})) {
					request.accept();
				} else {
					request.skip();
				}
			}.bind(this),
			run : function(request, response) {
				response.data = {
					message : 'Received the message!'
				}
				request.next();
			}.bind(this)
		});
	}
});

new Example({});

});
