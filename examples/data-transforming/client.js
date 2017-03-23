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
						topic: 'transform-object'
					},
					write: function(stream) {
						setInterval(function() {
							stream.write({
								type: 'object'
							});
						}.bind(this), 1000);
					}.bind(this),
					read: function(object) {
						console.log('Transformed object: ' + JSON.stringify(object, null, 2));
					},
					error: function(error) {
						console.log('error: ' + JSON.stringify(error, null, 2));
					}
				});

				sequence.next();

			}.bind(this)

		);
	}
});
