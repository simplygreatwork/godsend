
var io = require('socket.io-client');
var ss = require('socket.io-stream');
var Class = require('./lib/godsend/Class');
var Server = require('./lib/godsend/Server');
var Bus = require('./lib/godsend/Bus');

Main = module.exports = Class.extend({
	
	initialize : function(properties) {
		
		Object.assign(this, properties);
	},
	
	start : function() {
		
		new Server().start(function() {
		   console.log('The server has been started.');
		   new Zeus().start();
		   new Agent().start();
		});
	}
});

Zeus = Class.extend({
   
   initialize : function(properties) {
      
      Object.assign(this, properties);
   },
   
   start : function() {
      
      new Bus({
         address : 'http://127.0.0.1:8080'
      }).connect({
			responded : function(result) {
            this.connection = result.connection;
            setTimeout(function() {
               if (true) this.transform();
               if (true) this.put();
               if (true) this.get();
            }.bind(this), 50);
			}.bind(this)
      });
   },
   
   transform : function() {
      
      this.connection.send({
         pattern : {
            topic : 'store',
            action : 'transform',
            collection : 'tasks'
         },
         write : function(stream) {
            stream.write({
               string : 'one'
            });
            stream.write({
               string : 'two'
            });
            stream.write({
               string : 'three'
            });
            stream.write({
               string : 'four'
            });
            stream.write({
               string : 'five'
            });
            stream.end();
         },
         read : function(value) {
            console.log('Zeus read: ' + JSON.stringify(value, null, 2));
         },
         error : function(value) {
            console.log('Zeus error: ' + JSON.stringify(value, null, 2));
         },
         receive : function(result) {
            console.log('received: ' + JSON.stringify(result, null, 2));
         }
      });
   },
   
   put : function() {
      
      this.connection.send({
         pattern : {
            topic : 'store',
            action : 'put',
            collection : 'tasks'
         },
         write : function(stream) {
            stream.write({
               string : 'one'
            });
            stream.write({
               string : 'two'
            });
            stream.write({
               string : 'three'
            });
            stream.end();
         },
         read : function(value) {
            console.log('Zeus read: ' + JSON.stringify(value, null, 2));
         },
         receive : function(result) {
            console.log('received: ' + JSON.stringify(result, null, 2));
         }
      });
   },
   
   get : function() {
      
      this.connection.send({
         pattern : {
            topic : 'store',
            action : 'get',
            collection : 'tasks'
         },
         write : function(stream) {
            stream.write({
               where : {
                  birthyear : '1938'
               }
            });
            stream.end();
         },
         read : function(value) {
            console.log('Zeus read: ' + JSON.stringify(value, null, 2));
         },
         receive : function(result) {
            console.log('received: ' + JSON.stringify(result, null, 2));
         }
      });
   }
});

Agent = Class.extend({
   
   initialize : function(properties) {
      
      Object.assign(this, properties);
   },
   
   start : function() {
      
      new Bus({
         address : 'http://127.0.0.1:8080'
      }).connect({
			responded : function(result) {
            this.connection = result.connection;
            console.log('Agent is connected.');
            this.respond();
			}.bind(this)
      });
   },
   
   respond : function() {
      
      this.connection.process({
         on : function(request) {
            if (request.matches({
               topic : 'store',
               action : 'transform'
            })) {
               request.accept();
            } else {
               request.skip();
            }
         },
         run : function(stream) {
            var value = stream.object;
            value.string = value.string + 1;
            stream.push(value);
            if (false) {
               stream.err({
                  message : 'I am a second error message.'
               });
            }
            stream.next();
         }
      });
      
      this.connection.process({
         on : function(request) {
            if (request.matches({
               topic : 'store',
               action : 'put'
            })) {
               request.accept();
            } else {
               request.skip();
            }
         },
         run : function(stream) {
            stream.push({
               message : 'Put "' + JSON.stringify(stream.object) + '"'
            });
            stream.next();
         }
      });
      
      this.connection.process({
         on : function(request) {
            if (request.matches({
               topic : 'store',
               action : 'get'
            })) {
               request.accept();
            } else {
               request.skip();
            }
         },
         run : function(stream) {
            stream.push({
               id : 3
            });
            stream.push({
               id : 2
            });
            stream.next();
         }
      });
   }
});
