

var url = require('url');


var Router = function(options){
	console.log('--> Initializing Router middleware...');
	this.options = options;
};


Router.prototype = {

	routes: {
		get: {},
		post: {}
	},
	
	getParamKeys: function(route, regex){
		var params = route.match(new RegExp(regex));
		params.shift();
		params = params.map(function(item, index){
			return item.replace(':', '');
		});	
		return params;
	},

	addRoute: function(method, route, fn){
		var routeRegex = '^/' + route.replace(/:([\w\d]+)/g, '([^/]*)').replace('/', '') + '$';

		this.routes[method][route] = {
			method: method,
			route: route,
			params: this.getParamKeys(route, routeRegex),
			regex: routeRegex,
			fn: fn
		};
		return this;
	},

	get: function(route, fn){
		return this.addRoute('get', route, fn);
	},

	post: function(route, fn){
		return this.addRoute('post', route, fn);
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
			response.redirect(pathname.replace(/\/$/, '') + (parsed.search || ''));
			return;
		}

		for (var route in this.routes[method]) {
			var routeObj = this.routes[method][route];
			var regex = new RegExp(routeObj.regex);
			var matches = pathname.match(regex);

			if (matches) {
				matches.shift();

				routeObj.params.forEach(function(item, index){
					request.params[item] = matches[index];
				});

				var found = true;
				break;
			}
		}

		// if not found response.notFound
		// else response.error

		if (!found) {
			if (this.options.environment === 'production') {
				var routeObj = this.routes.get['/notfound'];
				var matches = null;
			} else {
				throw new Error(pathname + ' Route not found');
			}
		}

		if (process.env.NODE_ENV == 'development') {
			console.log('parsed');
			console.log(parsed);
			request.calvin.route = routeObj;
			request.calvin.matches = matches;
			console.log(routeObj.params);
			console.log(request.params);
		}

		this.routes[method][route].fn(request, response);

		if (next) next();
	}

};


module.exports = Router;