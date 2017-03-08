
init = function() {

godsend.Utility = {
	
	digest : function(string) {
		
		return string;
	},
	
	digesting : function(string) {
		
		var md = forge.md.sha1.create();
		md.update(string);
		return md.digest().toHex();
	},
	
	matchesPartially : function(pattern, patterns) {						// really need to study this in depth (all the limits)
		
		var result = false;
		patterns.forEach(function(each) {
			var match = true;
			for (var property in each) {
				if (each[property] != pattern[property]) {
					match = false;
				}
			}
			if (match === true) {
				result = true;
			}
		}.bind(this));
		return result;
	},
	
	matchesStrictly : function(pattern, patterns) {
		
		var result = false;
		var string = godsend.Utility.stringify(pattern);
		patterns.forEach(function(each) {
			if (godsend.Utility.stringify(each) == string) {
				result = true;
			}
		}.bind(this));
		return result;
	},
	
	matchesProperties : function(pattern, properties) {
		
		var result = true;
		var property = null;
		for (property in properties) {
			if (pattern[property] != properties[property]) {
				result = false;
			}
		}
		return result;
	},
	
	stringify : function(object) {
		
		return JSON.stringify(object, Object.keys(object).sort())
	},
	
	isHandled : function(object) {
		
		var result = false;
		if (object.result) {
			if (JSON.stringify(object.result) != '{}') {
				result = true;
			}
		}
		return result;
	}
};

};
