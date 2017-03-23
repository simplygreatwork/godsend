
var uuid = require('uuid');
var Logger = require('js-logger');
var Class = require('../../godsend.js').Class;
var Bus = require('../../godsend.js').Bus;
var Sequence = require('../../godsend.js').Sequence;

Client = module.exports = Class.extend({
	
	initialize : function(properties) {
		
		var sender = new Sender({
			bus : new Bus({
				address : 'http://127.0.0.1:8080'
			})
		})
		sender.connect(function() {
			sender.start();
		}.bind(this));
	}
});

Sender = Class.extend({
	
	connect : function(callback) {
		
		this.bus.connect({
			credentials : {
				username : Credentials.get('client').username,
				passphrase : Credentials.get('client').passphrase,
			},
			responded : function(result) {
				this.connection = result.connection;
				callback();
			}.bind(this)
		});
	},
	
	start : function() {
		
		var sequence = Sequence.start(
			
			function() {
				
				this.connection.send({
					pattern : {
						topic : 'store',
						action : 'put',
						collection : 'tasks'
					},
					data : {
						key : uuid(),
						value : {
							number : 1
						}
					},
					receive : function(result) {
						console.log('Result: ' + JSON.stringify(result, null, 2));
						sequence.next();
					}.bind(this)
				});
				
			}.bind(this),
			
			function() {
				
				this.connection.send({
					pattern : {
						topic : 'store',
						action : 'put',
						collection : 'tasks'
					},
					data : {
						key : uuid(),
						value : {
							title : 'New Task'
						}
					},
					receive : function(result) {
						console.log('Result: ' + JSON.stringify(result, null, 2));
						sequence.next();
					}.bind(this)
				});
				
			}.bind(this),
			
			function() {
				
				this.connection.send({
					pattern : {
						topic : 'store',
						action : 'put',
						collection : 'tasks'
					},
					data : {
						key : uuid(),
						value : {
							title : 'Another New Task'
						}
					},
					receive : function(result) {
						console.log('Result: ' + JSON.stringify(result, null, 2));
						sequence.next();
					}.bind(this)
				});
				
			}.bind(this),
			
			function() {
				
				this.connection.send({
					pattern : {
						topic : 'store',
						action : 'all',
						collection : 'tasks'
					},
					data : {
						limit : 10,
						fields : {
							id : true,
							title : true,
							created : true
						}
					},
					receive : function(result) {
						console.log('Result: ' + JSON.stringify(result, null, 2));
						sequence.next();
					}.bind(this)
				});
				
			}.bind(this)

		);
	}
});
