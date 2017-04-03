var assert = require('proclaim');
var Logger = require('js-logger');

Assertions = module.exports = {
	
	connecting: function(properties) {
		
		try {
			assert.ok(properties.credentials, 'The credentials are missing from the connection request.');
			assert.ok(properties.credentials.username, 'The username is missing from the connection request.');
			assert.ok(properties.credentials.passphrase, 'The passphrase is missing from the connection request.');
		} catch (e) {
			throw e;
		}
	},
	
	sending : function(properties) {
		
		try {
			assert.ok(properties.pattern, 'The send request must contain a pattern object.');
			assert.notOk(properties.received, 'The name of the receiving function is "receive" and not "received".');
			assert.ok(properties.data || properties.write, 'The send request must contain a data object or write function.');
			assert.ok(properties.read || properties.receive, 'The send request must contain a read function or receive function.');
		} catch (e) {
			throw e;
		}
	},
	
	users : function(users) {
		
		Object.keys(users).forEach(function(key) {
			Assertions.user(users[key]);
		});
	},
	
	user : function(user) {
		
		try {
			assert.ok(user.credentials, 'A user is missing credentials.');
			assert.ok(user.credentials.username, 'A user is missing a username.');
			assert.ok(user.credentials.passphrase, 'A user "' + user.credentials.username + '" is missing a passphrase.');
			assert.ok(user.patterns, 'A user "' + user.credentials.username + '" is missing patterns.');
			assert.ok(user.patterns.sendable, 'A user "' + user.credentials.username + '" is missing sendable patterns.');
			assert.ok(user.patterns.receivable, 'A user "' + user.credentials.username + '" is missing receivable patterns.');
		} catch (e) {
			throw e;
		}
	}
};
