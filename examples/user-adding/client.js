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
				username: Credentials.get('admin').username,
				passphrase: Credentials.get('admin').passphrase,
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
						topic: 'authentication',
						action: 'put-user'
					},
					data: {
						credentials: {
							username: Credentials.get('new-user').username,
							passphrase: Credentials.get('new-user').passphrase,
						},
						patterns: {
							sendable: [{
								topic: 'post-message'
							}],
							receivable: []
						}
					},
					receive: function(result) {
						console.log('Result: ' + JSON.stringify(result.objects));
						sequence.next();
					}.bind(this)
				});

			}.bind(this),

			function() {

				this.connection.send({
					pattern: {
						topic: 'authentication',
						action: 'sign-in'
					},
					data: {
						credentials: {
							username: Credentials.get('new-user').username,
							passphrase: Credentials.get('new-user').passphrase,
						}
					},
					receive: function(result) {
						console.log('Result: ' + JSON.stringify(result.objects));
						sequence.next();
					}.bind(this)
				});

			}.bind(this),

			function() {

				this.connection.send({
					pattern: {
						topic: 'post-message'
					},
					data: {
						message: 'Message from user "new-user".'
					},
					receive: function(result) {
						console.log('Result: ' + JSON.stringify(result.objects));
						sequence.next();
					}.bind(this)
				});

			}.bind(this)

		);

	}
});
