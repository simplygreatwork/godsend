
require('helios-kernel/kernel.js');
kernel._getAbsolute = function(path, childPath) {
	
	if (! kernel._isRemote(path) && path.substr(0,1) != '/') {
		path = childPath.substr(0, childPath.lastIndexOf('/') + 1) + path;
	}
	var newPath = path;
	do {
		path = newPath;
		newPath = path.replace(/[\w\-\.~]*\/\.\.\//, '');
	} while (newPath != path);
	return path;
};

kernel.require(__dirname + '/scripts/Main.js', function() {
	
});
