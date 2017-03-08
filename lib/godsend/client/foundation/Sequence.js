
init = function() {
	
Sequence = {
	
	start : function() {
   	
		var next = null;
		var args = Array.prototype.slice.call(arguments);
		args.unshift(function() {
			next = function() {
				window.setTimeout(function() {
					this();
				}.bind(this), 20);
			}.bind(this);
			next();
		});
		
		Step.apply(this, args);
		
		return {
			next : next
		};
	}
};

};
