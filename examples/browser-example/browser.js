var Bus = godsend.Bus;

Client = Class.extend({

	initialize: function(properties) {

		var sender = new Sender({
			bus: new Bus({
				address: window.location.host
			})
		})
		sender.connect(function() {
			sender.start();
		}.bind(this));
	}
});

Sender = Class.extend({

	connect: function(callback) {

		this.bus.connect({
			credentials: {
				username: Credentials.get('client').username,
				passphrase: Credentials.get('client').passphrase,
			},
			responded: function(result) {
				this.connection = result.connection;
				callback();
			}.bind(this)
		});
	},

	start: function() {

		var sequence = Sequence.start(

			function() {

				this.connection.send({
					pattern: {
						topic: 'store',
						action: 'put',
						collection: 'tasks'
					},
					data: {
						key: godsend.uuid(),
						value: {
							number: 1
						}
					},
					receive: function(result) {
						console.log('Result: ' + JSON.stringify(result, null, 2));
						sequence.next();
					}.bind(this)
				});

			}.bind(this),

			function() {

				this.connection.send({
					pattern: {
						topic: 'store',
						action: 'put',
						collection: 'tasks'
					},
					data: {
						key: godsend.uuid(),
						value: {
							title: 'New Task'
						}
					},
					receive: function(result) {
						console.log('Result: ' + JSON.stringify(result, null, 2));
						sequence.next();
					}.bind(this)
				});

			}.bind(this),

			function() {

				this.connection.send({
					pattern: {
						topic: 'store',
						action: 'put',
						collection: 'tasks'
					},
					data: {
						key: godsend.uuid(),
						value: {
							title: 'Another New Task'
						}
					},
					receive: function(result) {
						console.log('Result: ' + JSON.stringify(result, null, 2));
						sequence.next();
					}.bind(this)
				});

			}.bind(this),

			function() {

				this.connection.send({
					pattern: {
						topic: 'store',
						action: 'all',
						collection: 'tasks'
					},
					data: {
						limit: 10,
						fields: {
							id: true,
							title: true,
							created: true
						}
					},
					receive: function(result) {
						console.log('Result: ' + JSON.stringify(result, null, 2));
						sequence.next();
					}.bind(this)
				});

			}.bind(this),

			function() {

				this.connection.send({
					pattern: {
						topic: 'store',
						action: 'all',
						collection: 'tasks'
					},
					data: {
						limit: 10,
						fields: {
							id: true,
							title: true,
							created: true,
							modified: true
						}
					},
					receive: function(result) {
						console.log('Result: ' + JSON.stringify(result, null, 2));
						sequence.next();
					}.bind(this)
				});

			}.bind(this)

		);
	}
});

new Client({});
