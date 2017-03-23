
var Transform = require('stream').Transform || require('readable-stream').Transform;
var util = require('util');

function Processor(properties) {
	
	Transform.call(this, {
		objectMode : true
	});
	Object.assign(this, properties);
	this.expressive = this.expressive ? undefined : true;
	this.initializeTransform();
	this.on('error', function(error) {
		console.error('error: ' + error);
	}.bind(this));
}

util.inherits(Processor, Transform);

Object.assign(Processor.prototype, {
	
	initializeTransform : function() {
		
		if (this.expressive) {
			this._transform = function(chunk, encoding, next) {
				var stream = {
					request : this.request,
					response : this.response,
					object : chunk,
					encoding : encoding,
					next : next,
					push : this.push.bind(this),
					err : this.err.bind(this)
				};
				this.process(stream);
			};
		} else {
			this._transform = function(chunk, encoding, next) {
				this.process(chunk, encoding, next, this.stream);
			};
		}
	},
	
	err : function(error) {
		
		this.errors.write(error);
	}
});

module.exports = Processor;
