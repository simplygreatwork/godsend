var uuid = require('uuid');
var Logger = require('js-logger');
var Class = require('../../godsend.js').Class;
var Bus = require('../../godsend.js').Bus;
var Sequence = require('../../godsend.js').Sequence;

Client = module.exports = Class.extend({

	initialize: function(properties) {

		var sender = new Sender({
			bus: new Bus({
				address: 'http://127.0.0.1:8080'
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
				username: Credentials.get('sender').username,
				passphrase: Credentials.get('sender').passphrase,
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

				console.log('Sending request.');
				this.connection.send({
					pattern: {
						topic: 'store',
						action: 'get',
						collection: 'tasks'
					},
					data: {
						key: uuid.v4()
					},
					receive: function(result) {
						console.log('Result: ' + JSON.stringify(result.objects, null, 2));
						sequence.next();
					}.bind(this)
				});

				sequence.next();

			}.bind(this)

		);
	}
});
