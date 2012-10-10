

var Vhosts = new Class({

	initialize: function(hosts, server){
		console.log('--> Initializing Vhost middleware...');

		if (!hosts) 	throw new Error('vhost hosts required');
		if (!server) 	throw new Error('vhost server required');

		this.host = hosts[process.env.NODE_ENV];
		this.server = server;
		this.redirects = hosts.redirects || {};
	},

	redirect: function(response, url){
		response.writeHead(301, {
			'Location': url,
			'Pragma': 'no-cache'
		});
		response.end();
	},

	handler: function(request, response, next){
		if (!request.headers.host) return next();

		var host = request.headers.host.split(':')[0];

		if (this.redirects[host]) {
			this.redirect(response, this.redirects[host]);
		} else if (host == this.host) {
			this.server.emit('request', request, response, next);
		} else if (next) {
			next();
		}
	}

});


module.exports = Vhosts;

