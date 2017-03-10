
godsend.ready(function(godsend) {
Logger.ready(function() {

Example = Class.extend({
	
	initialize : function(properties) {
		
		var sender = new Sender({
			bus : new godsend.Bus({
				local : false
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
			connected : function(properties) {
				this.connection = properties.connection;
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
						key : uuid.v4(),
						value : {}
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
						key : uuid.v4(),
						value : {
							title : 'New Task'
						}
					},
					receive : function(result) {
						Logger.get('main').log('Result: ' + JSON.stringify(result, null, 2));
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
						key : uuid.v4(),
						value : {
							title : 'Another New Task'
						}
					},
					receive : function(result) {
						Logger.get('main').log('Result: ' + JSON.stringify(result, null, 2));
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
						Logger.get('main').log('Result: ' + JSON.stringify(result, null, 2));
						sequence.next();
					}.bind(this)
				});
				
			}.bind(this)
		);
	}
});

new Example({});
	
});
});
