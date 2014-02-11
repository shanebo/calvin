

var Vhosts = function(hosts, server){
	console.log('Initializing Vhost middleware...');
	this.host = hosts[process.env.NODE_ENV];
	this.server = server;
	this.redirects = hosts.redirects || {};
}


Vhosts.prototype = {

	handler: function(request, response, next){
		if (!request.headers.host) return next();

		var host = request.headers.host.split(':')[0];

		if (this.redirects[host]) {
			response.redirect(this.redirects[host], 301);
		} else if (host == this.host) {
			this.server.emit('request', request, response, next);
		} else if (next) {
			next();
		}
	}

};


module.exports = function(options){
	return new Vhosts(options);
}