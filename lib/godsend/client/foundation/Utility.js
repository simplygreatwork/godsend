
init = function() {

Utility = {
	
	digest : function(string) {
		
		var md = forge.md.sha1.create();
		md.update(string);
		return md.digest().toHex();
	}
};
	
};
