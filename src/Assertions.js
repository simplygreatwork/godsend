var assert = require('proclaim');

Assert = module.exports = {

	pattern: function(pattern) {
		
		try {
			assert.ok(pattern, 'The message pattern is missing from the request.');
		} catch (e) {
			Logger.get('assertion').error(e.message);
		}
	},

	credentials: function(credentials) {

		try {
			assert.ok(credentials, 'The credentials are missing from the connection request.');
			assert.ok(credentials.username, 'The username is missing from the connection request.');
			assert.ok(credentials.passphrase, 'The passphrase is missing from the connection request.');
		} catch (e) {
			Logger.get('assertion').error(e.message);
		}
	}
};
