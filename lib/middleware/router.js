

var url = require('url');


var Router = function(app){
	console.log('--> Initializing Router middleware...');
	this.app = app;
	this.addErrorRoutes();
};


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
		['403', '404', '500', '502', '503'].forEach(function(status){
			this.get('/' + status, function(request, response){
				response.writeHead(status, { 'Content-Type': 'text/html' });
				response.end(response.partial('calvin/' + status + '.html', { status: status }));
			});
		}.bind(this));
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
		var routeRegex = new RegExp('^/' + route.replace(/:([\w\d]+)/g, '([^/]*)').replace('/', '') + '$');

		this.routes[method][route] = {
			method: method,
			route: route,
			regex: routeRegex,
			params: this.getParamKeys(route, routeRegex),
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
			// url.parse().hash has a bug
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

		if (!found) throw new Error('404');

		if (this.app.environment == 'development') {
			request.calvin.route = routeObj;
			request.calvin.params = request.params;
		}

		this.routes[method][route].fn(request, response);

		if (next) next();
	}

};


module.exports = Router;