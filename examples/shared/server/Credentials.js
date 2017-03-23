Credentials = module.exports = {

	get: function(username) {

		return {
			username: username,
			passphrase: 'passphrase-to-hash'
		};
	}
};
