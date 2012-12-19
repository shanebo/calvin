

var url = require('url');
var resp		= require('../response');
var req			= require('../request');


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
		this.routes[method][route] = {
			method: method,
			route: route,
			params: this.getParamKeys(route, '^/' + route.replace(/:([\w\d]+)/g, '([^/]*)').replace('/', '') + '$'),
			regex: '^/' + route.replace(/:([\w\d]+)/g, '([^/]*)').replace('/', '') + '$',
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

//		for (var prop in req) request[prop] = req[prop];
//		for (var prop in resp) response[prop] = resp[prop];

		var method = request.method.toLowerCase();
		var parsed = url.parse(request.url, true);
		var pathname = parsed.pathname;

		request.query  = parsed.query;
		request.search = parsed.search;
		request.hash   = parsed.hash;

		if (pathname !== '/' && pathname.test(/\/$/)) {
			response.writeHead(302, {
				'Location': pathname.replace(/\/$/, '') + (parsed.search || ''),
				'Pragma': 'no-cache'
			});
			response.end();
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

		if (!found) {
			if (this.options.environment === 'production') {
				var routeObj = this.routes.get['/notfound'];
				var matches = null;
			} else {
				throw new Error(pathname + ' Route not found');
			}
		}

		if (process.env.NODE_ENV == 'development') {
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