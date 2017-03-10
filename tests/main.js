
require('../lib/godsend/server/main.js').ready(function(godsend) {

Runner = Class.extend({
	
	initialize : function(properties) {
		
		this.platform = new (require('./Platform.js'))();
		this.platform.start(function() {
			this.run();
		}.bind(this));
	},
	
	run : function() {
		
		var runner = this;
		var test = require('tape');
		
		test('Establishing a connection to the bus.', function(assert) {
			
			new godsend.Bus({
				local : false
			}).connect({
				credentials : {
					username : Credentials.get('client').username,
					passphrase : Credentials.get('client').passphrase,
				},
				connected : function(properties) {
					runner.connection = properties.connection;
					assert.notEquals(properties.connection, null, 'Is the connection connected?');
					assert.pass('The client has connected.');
					assert.end();
				}.bind(this)
			});
		});
		
		test('Sending a message pattern over the bus which is not authorized.', function(assert) {
			
			runner.connection.send({
				pattern : {
					topic : 'post-message-not-authorized'
				},
				data : {
					message : 'Can you hear me now?'
				},
				receive : function(result) {
					console.log('result: ' + JSON.stringify(result, null, 2));
					assert.notEquals(result.errors, undefined, 'Does result exist?');
					assert.notEquals(result.errors, undefined, 'Do errors exist?');
					assert.notEquals(result.errors.length, 0, 'Does more than one error exist?');
					assert.pass('Received a result with error.');
					assert.end();
				}.bind(this)
			});
		});
		
		test('Sending a message pattern over the bus which is authorized.', function(assert) {
			
			runner.connection.send({
				pattern : {
					topic : 'post-message'
				},
				data : {
					message : 'Can you hear me now?'
				},
				receive : function(result) {
					console.log('result: ' + JSON.stringify(result, null, 2));
					assert.notEquals(result, undefined, 'Does result exist?');
					assert.notEquals(result.value, undefined, 'Does result value exist?');
					assert.ok(result.errors, 'Do result errors exist?');
					assert.pass('Received a valid response.');
					assert.end();
				}.bind(this)
			});
		});
		
		test.onFinish(function() {
			
			console.log('All tests have finished.');
			console.log('Remember to tear down all connections at this time.');
			process.exit(0);
		});
	}
});

new Runner({});

});
