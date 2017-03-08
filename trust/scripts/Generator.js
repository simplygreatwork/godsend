
include('../../lib/godsend/server/foundation/include.js');

var forge = require('node-forge');
var fs = require('fs');

init = function() {

	Generator = Class.extend({
		
		initialize: function(properties) {
			
			console.log('Starting the generator.');
			Object.assign(this, properties);
			this.assets = {};
		},
		
		start: function() {
			
			this.createRootAuthority();
			this.signRootAuthority();
			this.createServerKeys();
			this.createServerCertificateSigningRequest();
			this.createServerCertificate();
			this.verifyCertificates();
		},

		createRootAuthority: function() {
			
			var keys = forge.pki.rsa.generateKeyPair(2048);
			var cert = forge.pki.createCertificate();
			this.assets.root = {};
			this.assets.root.keys = keys;
			this.assets.root.cert = cert;
			cert.publicKey = keys.publicKey;
			cert.serialNumber = '01';
			cert.validity.notBefore = new Date();
			cert.validity.notAfter = new Date();
			cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
			var attributes = this.config.attributes;
			cert.setSubject(attributes);
			cert.setIssuer(attributes);
			cert.setExtensions([{
				name: 'basicConstraints',
				cA: true
			}, {
				name: 'keyUsage',
				keyCertSign: true,
				digitalSignature: true,
				nonRepudiation: true,
				keyEncipherment: true,
				dataEncipherment: true
			}, {
				name: 'extKeyUsage',
				serverAuth: true,
				clientAuth: true,
				codeSigning: true,
				emailProtection: true,
				timeStamping: true
			}, {
				name: 'nsCertType',
				client: true,
				server: true,
				email: true,
				objsign: true,
				sslCA: true,
				emailCA: true,
				objCA: true
			}, {
				name: 'subjectAltName',
				altNames: [{
					type: 6,
					value: this.config.uri
				}, {
					type: 7,
					ip: this.config.ip
				}]
			}, {
				name: 'subjectKeyIdentifier'
			}]);
		},

		signRootAuthority: function() {
			
			var keys = this.assets.root.keys;
			var cert = this.assets.root.cert;
			cert.sign(keys.privateKey);
			console.log('The root certificate has been self signed.');
			var pem = {
				certificate: forge.pki.certificateToPem(cert),
				keys : {
					'private': forge.pki.privateKeyToPem(keys.privateKey),
					'public': forge.pki.publicKeyToPem(keys.publicKey)
				},
			};
			this.write('root.cert.pem', pem.certificate);
			this.write('root.key.private.pem', pem.keys.private);
			this.write('root.key.public.pem', pem.keys.public);
		},
		
		createServerKeys: function() {
			
			this.assets.server = {};
			var keys = this.assets.server.keys = forge.pki.rsa.generateKeyPair(2048);
			var pem = {
				keys : {
					'private' : forge.pki.privateKeyToPem(keys.privateKey),
					'public' : forge.pki.publicKeyToPem(keys.publicKey)
				}
			};
			this.write('server.key.private.pem', pem.keys.private);
			this.write('server.key.public.pem', pem.keys.public);
		},
		
		createServerCertificateSigningRequest: function() {
			
			var csr = this.assets.server.csr = forge.pki.createCertificationRequest();
			csr.publicKey = this.assets.server.keys.publicKey;
			csr.setSubject(this.config.attributes);
			csr.sign(this.assets.server.keys.privateKey);
			console.log('The certificate signing request has been signed.');
			var pem = {
				csr: forge.pki.certificationRequestToPem(csr)
			};
			this.write('server.csr.pem', pem.csr);
		},
		
		createServerCertificate: function() {
			
			var csr = this.assets.server.csr;
			var keys = this.assets.root.keys;
			var caCert = this.assets.root.cert;
			var caKey = keys.privateKey;
			if (csr.verify()) {
				console.log('The certificate signing request has been verified.');
			} else {
				console.log('The certificate signing request could not be verified.');
			}
			var cert = this.assets.server.cert = forge.pki.createCertificate();
			cert.serialNumber = '02';
			cert.validity.notBefore = new Date();
			cert.validity.notAfter = new Date();
			cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
			cert.setSubject(csr.subject.attributes);
			cert.setIssuer(caCert.subject.attributes);
			cert.setExtensions([{
				name: 'basicConstraints',
				cA: true
			}, {
				name: 'keyUsage',
				keyCertSign: true,
				digitalSignature: true,
				nonRepudiation: true,
				keyEncipherment: true,
				dataEncipherment: true
			}, {
				name: 'subjectAltName',
				altNames: [{
					type: 6,
					value: this.config.uri
				}]
			}]);
			cert.publicKey = csr.publicKey;
			cert.sign(caKey);
			console.log('The server certificate has been signed.');
			var pem = {
				certificate: forge.pki.certificateToPem(cert)
			};
			this.write('server.cert.pem', pem.certificate);
		},
		
		verifyCertificates: function() {
			
			console.log('Verifying both the root and server certificates.');
			var validity = {
				root : this.verifyCertificate(this.assets.root.cert),
				server : this.verifyCertificate(this.assets.server.cert),
			};
			console.log('Valid: ' + JSON.stringify(validity, null, 2));
		},
		
		verifyCertificate: function(cert) {
			
			var result = false;
			var caStore = forge.pki.createCaStore();
			caStore.addCertificate(cert);
			try {
				forge.pki.verifyCertificateChain(caStore, [cert], function(vfd, depth, chain) {
					console.log('vfd: ' + vfd);
					if (vfd === true) {
						if (false) console.log('cert.verifySubjectKeyIdentifier(): ' + cert.verifySubjectKeyIdentifier());
						result = true;
					}
					return true;
				});
			} catch (e) {
				console.log('Certificate verification failure: ' + JSON.stringify(e, null, 2));
			}
			return result;
		},

		write: function(key, value) {
			
			fs.writeFileSync(this.config.directory + '/' + key, value);
		}
	})

};
