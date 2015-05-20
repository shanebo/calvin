

var Memcache = function(app){
	console.log('Initializing Memcache middleware...');
	app.memcachedRoutes = new RegExp('^' + app.memcache.routes.join('$|^') + '$');
	this.app = app;
}


Memcache.prototype = {

	handler: function(request, response, next){
		var asset = this.app.cache[request.pathname];
		
		if (request.method === 'GET' && asset && asset.headers['Content-Type'] === 'text/html') {
			request.calvin.asset = 'memcached';
			response.serve(asset);
		} else {
			next();
		}
	}

};


module.exports = function(options){
	return new Memcache(options);
}