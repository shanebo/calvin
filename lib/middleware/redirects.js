

var Redirects = function(settings){
	console.log('Initializing Redirects middleware...');
	this.redirects = this.prepare(settings.redirects);
}


Redirects.prototype = {

	prepare: function(redirects){
		if (redirects) {
			var prepped = {};
			for (var prop in redirects) {
				if (redirects.hasOwnProperty(prop)) {
					prepped[prop.toLowerCase()] = redirects[prop];
				}
			}
			return prepped;
		} else {
			return {};
		}
	},

	handler: function(request, response, next){
		// update this to use request.hostname, request.protocol
		var protocol = request.connection.encrypted ? 'https://' : 'http://';
		var host = request.headers.host ? request.headers.host.split(':')[0] : false;
		var url = request.url.toLowerCase();

		if (this.redirects[url]) {
			response.redirect(this.redirects[url], 301);
		} else if (!host) {
			next();
		} else if (this.redirects[protocol + host]) {
			response.redirect(this.redirects[protocol + host] + url, 301);
		} else {
			next();
		}
	}

};


module.exports = function(settings){
	return new Redirects(settings);
}