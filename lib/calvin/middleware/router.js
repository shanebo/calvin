

	var fs = require('fs');
	
	
	var Router = new Class({
	
		Implements: Options,
	
		options: {
			environment: process.env.NODE_ENV,
			directory: '',
			controllers: '/controllers/'
		},
	
		controllers: {},

		routes: {
			get: {},
			post: {}
		},
		
		initialize: function(options, cache) {
			console.log('--> Initializing Router middleware...');
	        this.setOptions(options);
			this.cache = cache;
			this.db = this.options.db;
			this.engine = this.options.engine;
			this.loadControllers(this.options.controllers);
		},
	
		loadControllers: function(dir) {
			this.controllers['Controller'] = require('./../controller');

			fs.readdirSync(dir).forEach(function(file) {
				if (file.charAt(0) == '.') return;
				this.controllers[file.replace('.js', '').capitalize()] = require(dir + file);
			}.bind(this));
		},
	
		addRoute: function(method, route) {
			this.routes[method][route] = this.adding = {
				method: method,
				route: route,
				regex: '^/' + route.replace(/:([\w\d]+)/g, '([^/]*)').replace('/', '') + '$'
			};
			return this;
		},
	
		get: function(route, fn) {
			// add logic so I can just point to simple methods for simpler projects
			return this.addRoute('get', route);
		},
	
		post: function(route, fn) {
			// add logic so I can just point to simple methods for simpler projects
			return this.addRoute('post', route);
		},
	
		to: function(action) {
			var route = this.adding;
			var map = action.split('.');
			route.controller = map[0];
			route.action = map[1];
			delete this.adding;
		},

		handler: function(req, res, next) {
			var method = req.method.toLowerCase();
			var url = (req.url != '/') ? req.url.replace(/\/$/, '') : req.url;
			
			for (var route in this.routes[method]) {
	
				var routeObj = this.routes[method][route];
				var regex = new RegExp(routeObj.regex);
				var matches = url.match(regex);
	
				if (matches) {
					matches.shift();
					var map = { route: routeObj, args: matches };
					var found = true;
					break;
				}
			}

			if (!found) {
				// fix error handling
				if (this.options.environment == 'development') {
					var map = {
						route: {
							method: 'get',
							route: '/error',
							controller: 'Controller',
							action: 'error'
						},
					  	args: ['error']
					}
				} else {
					var map = {
						route: {
							method: 'get',
							route: '/notfound',
							controller: 'Main',
							action: 'notFound'
						},
					  	args: ['path not found']
					}
				}
			}
	
			console.log('\nRouting: ' + url);
			console.log('  --> route: ' + map.route.route);
			console.log('  --> controller: ' + map.route.controller);
			console.log('  --> action: ' + map.route.action);
			console.log('  --> args: ' + JSON.stringify(map.args) + '\n');
			console.log('  --> map: ' + JSON.stringify(map));

			var controller = new this.controllers[map.route.controller](req, res, this);
			controller[map.route.action].pass(map.args, controller)();
			if (next) next();
		}
	
	});
	
	
	module.exports = Router;
	
