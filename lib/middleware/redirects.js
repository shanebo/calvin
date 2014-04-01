

var Redirects = function(options){
	console.log('Initializing Redirects middleware...');
	this.redirects = options.redirects || {};
}


Redirects.prototype = {

	handler: function(request, response, next){
		var protocol = request.connection.encrypted ? 'https://' : 'http://';
		var host = request.headers.host ? request.headers.host.split(':')[0] : false;

		if (this.redirects[request.url]) {
			response.redirect(this.redirects[request.url], 301);
		} else if (!host && next) {
			next();
		} else if (this.redirects[protocol + host]) {
			response.redirect(this.redirects[protocol + host] + request.url, 301);
		} else if (next) {
			next();
		}
	}

};


module.exports = function(options){
	return new Redirects(options);
}