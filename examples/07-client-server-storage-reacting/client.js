
godsend.ready(function(godsend) {

var Bus = godsend.Bus;
var Broker = godsend.Broker;
var Exchange = godsend.exchange.Open;

Example = Class.extend({
	
	initialize : function(properties) {
		
		var bus = new Bus({
			local : false
		});
		new Receiver.Task({
			bus : bus
		}).connect(function() {
			new Receiver.Patient({
				bus : bus
			}).connect(function() {
				new Sender({
					bus : bus
				}).connect(function(sender) {
					sender.start();
				}.bind(this));
			}.bind(this));
		}.bind(this));
	}
});

Sender = Class.extend({
	
	connect : function(callback) {
		
		this.bus.connect({
			credentials : {
				username : Credentials.get('sender').username,
				passphrase : Credentials.get('sender').passphrase,
			},
			connected : function(properties) {
				this.connection = properties.connection;
				callback(this);
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
						collection : 'patients'
					},
					data : {
						key : uuid.v4(),
						value : {
							title : 'New Patient'
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

Receiver = {
	
	Task : Class.extend({
		
		connect : function(callback) {
			
			this.bus.connect({
				credentials : {
					username : Credentials.get('task-receiver').username,
					passphrase : Credentials.get('task-receiver').passphrase,
				},
				connected : function(properties) {
					this.connection = properties.connection;
					this.receive();
					callback();
				}.bind(this)
			});
		},
		
		receive : function() {
			
			this.connection.receive({
				id : 'store-put-tasks-notify',
				on : function(request, response) {
					if (request.matches({
						topic : 'store',
						action : 'put-notify',
						collection : 'tasks'
					})) {
						request.accept();
					} else {
						request.skip();
					}
				}.bind(this),
				run : function(request, response) {
					console.log('Task receiver was notified that a task was updated.');
					request.next();
				}.bind(this)
			});
			
			this.connection.receive({
				id : 'store-put-patients-notify',
				on : function(request, response) {
					if (request.matches({
						topic : 'store',
						action : 'put-notify',
						collection : 'patients'
					})) {
						request.accept();
					} else {
						request.skip();
					}
				}.bind(this),
				run : function(request, response) {
					console.log('Task receiver was notified that a patient was updated.');
					request.next();
				}.bind(this)
			});
		}
	}),
	
	Patient : Class.extend({
		
		connect : function(callback) {
			
			this.bus.connect({
				credentials : {
					username : Credentials.get('patient-receiver').username,
					passphrase : Credentials.get('patient-receiver').passphrase,
				},
				connected : function(properties) {
					this.connection = properties.connection;
					this.receive();
					callback();
				}.bind(this)
			});
		},
		
		receive : function() {
			
			this.connection.receive({
				id : 'store-put-tasks-notify',
				on : function(request, response) {
					if (request.matches({
						topic : 'store',
						action : 'put-notify',
						collection : 'tasks'
					})) {
						request.accept();
					} else {
						request.skip();
					}
				}.bind(this),
				run : function(request, response) {
					console.log('Patient receiver was notified that a task was updated.');
					request.next();
				}.bind(this)
			});
			
			this.connection.receive({
				id : 'store-put-patients-notify',
				on : function(request, response) {
					if (request.matches({
						topic : 'store',
						action : 'put-notify',
						collection : 'patients'
					})) {
						request.accept();
					} else {
						request.skip();
					}
				}.bind(this),
				run : function(request, response) {
					console.log('Patient receiver was notified that a patient was updated.');
					request.next();
				}.bind(this)
			});
		}
	})
};


new Example({});
	
});
