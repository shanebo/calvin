

var url = require('url');


var Router = function(app){
	console.log('Initializing Router middleware...');
	this.app = app;
	this.addErrorRoutes();
}


Router.prototype = {

	routes: {
		get: {},
		post: {}
	},
	
	get: function(route, fn){
		return this.addRoute('get', route, fn);
	},

	post: function(route, fn){
		return this.addRoute('post', route, fn);
	},

	addErrorRoutes: function(){
		[400, 401, 403, 404, 408, 500, 502, 503].forEach(function(status){
			this.get('/' + status, function(request, response, message){
				message = message || response.errorMessages[status];
				var partial = response.partial('calvin/status.html', { status: status, message: message });
				response.send(partial, status);
			}.bind(this));
		}, this);
	},

	getParamKeys: function(route, regex){
		var params = route.match(regex);
		params.shift();
		params = params.map(function(item, index){
			return item.replace(':', '');
		});	
		return params;
	},

	addRoute: function(method, route, fn){
		var regex = new RegExp('^/' + route.replace(/:([\w\d]+)/g, '([^/]*)').replace('/', '') + '$');

		this.routes[method][route] = {
			method: method,
			route: route,
			regex: regex,
			params: this.getParamKeys(route, regex),
			fn: fn
		};

		this.app.routes = this.routes;
	},

	handler: function(request, response, next){
		var method = request.method.toLowerCase();
		var parsed = url.parse(request.url, true);
		var pathname = parsed.pathname;

		request.query  = parsed.query;
		request.search = parsed.search;
		request.hash   = parsed.hash;
		request.params = {};

		if (pathname !== '/' && pathname.test(/\/$/)) {
			// redirects to pathname without trailing slash
			response.redirect(request.url.replace(/\/([^/]*)$/, '$1'), 301);
			return;
		}

		for (var route in this.routes[method]) {
			var routeObj = this.routes[method][route];
			var matches = pathname.match(routeObj.regex);

			if (matches) {
				matches.shift();
				routeObj.params.forEach(function(item, index){
					request.params[item] = matches[index];
				});
				var found = true;
				break;
			}
		}

		if (!found) throw new Error(404);

		request.calvin.route = routeObj;
		this.routes[method][route].fn(request, response);

		if (next) next();
	}

};


module.exports = function(options){
	return new Router(options);
}