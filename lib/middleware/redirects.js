

var Redirects = function(options){
	console.log('Initializing Redirects middleware...');
	this.redirects = options.redirects || {};
}


Redirects.prototype = {

	handler: function(request, response, next){
		if (this.redirects[request.url]) {
			response.redirect(this.redirects[request.url], 301);
		} else if (next) {
			next();
		}
	}

};


module.exports = function(options){
	return new Redirects(options);
}