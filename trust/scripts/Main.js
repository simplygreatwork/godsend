
include('../../lib/godsend/server/foundation/include.js');
include('Generator.js');

var homedir = require('homedir');

init = function() {
	
	Main = Class.extend({
		
		initialize : function() {
			
			console.log('Main.initialize');
			this.initializeGenerator();
		},
		
		initializeGenerator : function() {
			
			this.generator = new Generator({
				config : {
					directory : homedir() +  '/workspace/trust',
					uri : 'http://www.domain.com',
					ip : '127.0.0.1',
					attributes : [{
					  name: 'commonName',
					  value: 'domain.com'
					}, {
					  name: 'countryName',
					  value: 'US'
					}, {
					  shortName: 'ST',
					  value: 'Texas'
					}, {
					  name: 'localityName',
					  value: 'Austin'
					}, {
					  name: 'organizationName',
					  value: 'Development'
					}, {
					  shortName: 'OU',
					  value: 'Development'
					}]
				}
			});
			this.generator.start();
		}
	});
	
	new Main();
};
