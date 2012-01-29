

var fs = require('fs');


var Router = new Class({

	controllers: {
		Controller: require('./../controller')
	},

	routes: {
		get: {},
		post: {}
	},
	
	initialize: function(options){
		console.log('--> Initializing Router middleware...');
		this.options = options;
		this.loadControllers(options.controllers);
	},

	loadControllers: function(dir){
		fs.readdirSync(dir).forEach(function(file){
			if (file.charAt(0) == '.') return;
			this.controllers[file.replace('.js', '').capitalize()] = require(dir + file);
		}.bind(this));
	},

	addRoute: function(method, route){
		this.routes[method][route] = this.adding = {
			method: method,
			route: route,
			regex: '^/' + route.replace(/:([\w\d]+)/g, '([^/]*)').replace('/', '') + '$'
		};
		return this;
	},

	get: function(route, fn){
		return this.addRoute('get', route);
	},

	post: function(route, fn){
		return this.addRoute('post', route);
	},

	to: function(action){
		var route = this.adding;
		var map = action.split('.');
		route.controller = map[0];
		route.action = map[1];
		delete this.adding;
	},

	handler: function(request, response, next){
		var method = request.method.toLowerCase();
		var url = (request.url != '/') ? request.url.replace(/\/$/, '') : request.url;
		
		for (var route in this.routes[method]) {

			var routeObj = this.routes[method][route];
			var regex = new RegExp(routeObj.regex);
			var matches = url.match(regex);

			if (matches) {
				matches.shift();
				var found = true;
				break;
			}
		}

		if (!found) {
			if (this.options.environment === 'production') {
				var routeObj = this.routes.get['/notfound'];
				var matches = null;
			} else {
				throw new Error(url + ' Route not found');
			}
		}

		request.calvin.route = routeObj;
		request.calvin.matches = matches;

		var controller = new this.controllers[routeObj.controller](request, response, this.options);
		controller[routeObj.action].pass(matches, controller)();

		if (next) next();
	}

});


module.exports = Router;

