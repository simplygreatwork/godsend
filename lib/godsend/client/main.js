
window.godsend = {
	
	load : function(callback) {
		
		kernel.require(kernel.full('../../lib/godsend/client/include.js'), function() {
			window.godsend.callback(window.godsend);
		});
	},
	
	ready : function(callback) {
		
		window.godsend.callback = callback;
	}
};

window.onload = function() {
	window.godsend.load(function() {
		console.log('godsend loaded.');
	});
}
