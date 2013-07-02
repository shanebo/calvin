

var Redirects = function(options){
	console.log('--> Initializing Redirects middleware...');
	this.redirects = options.redirects || {};
};


Redirects.prototype = {

	handler: function(request, response, next){
		if (!request.headers.host) return next();

		var host = request.headers.host.split(':')[0];

		if (host === this.redirects[host]) {
			response.redirect(this.redirects[host], 301);
//		} else if () {
//			response.redirect(this.redirects[host] + request.url, 301);
		} else if (next) {
			next();
		}
	}

};


module.exports = Redirects;