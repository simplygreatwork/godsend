var uuid = require('uuid');
var Logger = require('js-logger');
var Class = require('../../godsend.js').Class;
var Bus = require('../../godsend.js').Bus;
var Sequence = require('../../godsend.js').Sequence;

Client = module.exports = Class.extend({

	initialize: function(properties) {

		new Receiver.Task({
			bus: this.bus = new Bus({
				address: 'http://127.0.0.1:8080'
			})
		}).connect(function() {
			new Receiver.Patient({
				bus: this.bus
			}).connect(function() {
				new Sender({
					bus: this.bus
				}).connect(function(sender) {
					sender.start();
				}.bind(this));
			}.bind(this));
		}.bind(this));
	}
});

Sender = Class.extend({

	connect: function(callback) {

		this.bus.connect({
			credentials: {
				username: Credentials.get('sender').username,
				passphrase: Credentials.get('sender').passphrase,
			},
			responded: function(result) {
				this.connection = result.connection;
				callback(this);
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
						key: uuid(),
						value: {
							title: 'New Task'
						}
					},
					receive: function(result) {
						console.log('Result: ' + JSON.stringify(result.objects, null, 2));
						sequence.next();
					}.bind(this)
				});

			}.bind(this),

			function() {

				this.connection.send({
					pattern: {
						topic: 'store',
						action: 'put',
						collection: 'patients'
					},
					data: {
						key: uuid(),
						value: {
							title: 'New Patient'
						}
					},
					receive: function(result) {
						console.log('Result: ' + JSON.stringify(result.objects, null, 2));
						sequence.next();
					}.bind(this)
				});

			}.bind(this)

		);
	}
});

Receiver = {

	Task: Class.extend({

		connect: function(callback) {

			this.bus.connect({
				credentials: {
					username: Credentials.get('task-receiver').username,
					passphrase: Credentials.get('task-receiver').passphrase,
				},
				responded: function(result) {
					this.connection = result.connection;
					this.process();
					callback();
				}.bind(this)
			});
		},

		process: function() {

			this.connection.process({
				id: 'store-put-tasks-notify-task-receiver',
				on: function(request) {
					request.accept({
						topic: 'store',
						action: 'put-notify',
						collection: 'tasks'
					});
				}.bind(this),
				run: function(stream) {
					console.log('Task receiver was notified that a task was updated.');
					stream.next();
				}.bind(this)
			});

			this.connection.process({
				id: 'store-put-patients-notify-task-receiver',
				on: function(request) {
					request.accept({
						topic: 'store',
						action: 'put-notify',
						collection: 'patients'
					});
				}.bind(this),
				run: function(stream) {
					console.log('Task receiver was notified that a patient was updated.');
					stream.next();
				}.bind(this)
			});
		}
	}),

	Patient: Class.extend({

		connect: function(callback) {

			this.bus.connect({
				credentials: {
					username: Credentials.get('patient-receiver').username,
					passphrase: Credentials.get('patient-receiver').passphrase,
				},
				responded: function(result) {
					this.connection = result.connection;
					this.process();
					callback();
				}.bind(this)
			});
		},

		process: function() {

			this.connection.process({
				id: 'store-put-tasks-notify-patient-receiver',
				on: function(request) {
					request.accept({
						topic: 'store',
						action: 'put-notify',
						collection: 'tasks'
					});
				}.bind(this),
				run: function(stream) {
					console.log('Patient receiver was notified that a task was updated.');
					stream.next();
				}.bind(this)
			});

			this.connection.process({
				id: 'store-put-patients-notify-patient-receiver',
				on: function(request) {
					request.accept({
						topic: 'store',
						action: 'put-notify',
						collection: 'patients'
					});
				}.bind(this),
				run: function(stream) {
					console.log('Patient receiver was notified that a patient was updated.');
					stream.next();
				}.bind(this)
			});
		}
	})
};
