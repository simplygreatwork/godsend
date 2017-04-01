var Transform = require('stream').Transform || require('readable-stream').Transform;
var util = require('util');

function Processor(properties) {
	
	Transform.call(this, {
		objectMode: true
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

	initializeTransform: function() {
		
		this.stream = {
			request: this.request,
			response: this.response,
			push: this.push.bind(this),
			err: this.err.bind(this)
		};
		if (this.expressive) {
			this._transform = function(chunk, encoding, next) {
				this.stream.object = chunk;
				this.stream.encoding = encoding;
				this.stream.next = next;
				this.process(this.stream);
			};
		} else {
			this._transform = function(chunk, encoding, next) {
				this.process(chunk, encoding, next, this.stream);
			};
		}
	},

	err: function(error) {

		this.errors.write(error);
	}
});

module.exports = Processor;
