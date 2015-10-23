

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
				message = message || response.messages[status];
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
		var regex = new RegExp('^/' + route.replace(/:([^\/]+)/g, '([^/]*)').replace('/', '') + '$');

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
		var pathname = request.pathname;

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
				var found = routeObj.params.every(function(param, index){
					var splat = param.split('(');
					var name = splat[0];
					var regex = splat[1] ? new RegExp(splat[1].replace(/\)$/, '')) : false;

					if (regex && !regex.test(matches[index])) {
						return false;
					}

					request.params[name] = matches[index];
					return true;
				});

				if (found) break;
			}
		}

		if (found) {
			request.calvin.route = routeObj;
			this.routes[method][route].fn(request, response);
		} else {
			response.send(404);
		}

		if (next) next();
	}

};


module.exports = function(options){
	return new Router(options);
}