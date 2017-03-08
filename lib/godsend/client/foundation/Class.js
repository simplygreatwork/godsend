
init = function() {

Class = {
	
	extend: function(properties) {
   	
		var superProto = this.prototype || Class;
		var proto = Object.create(superProto);
		Class.copy(properties, proto);
		var initializer = proto.initialize;
		if (! (initializer instanceof Function)) {
			if (false) {
				throw new Error('You must define a method "initialize".');
			} else {
				initializer = function(properties) {
					Object.assign(this, properties);
				};
			}
		}
		initializer.prototype = proto;
		initializer.super = superProto;
		initializer.extend = this.extend;
   	
		return initializer;
	},
	
	copy: function(source, target) {
		
		Object.getOwnPropertyNames(source).forEach(function(propName) {
			Object.defineProperty(target, propName, Object.getOwnPropertyDescriptor(source, propName));
		});
    
		return target;
	}
};
	
};
