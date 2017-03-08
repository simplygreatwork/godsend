
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
}

kernel.full = function(path) {
	
	var array = window.location.href.split('/');
	array.pop();
	return array.join('/') + '/' + path;
}
