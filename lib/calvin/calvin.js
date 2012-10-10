

require('../deps/mootools/loader');

var fs			= require('fs');
var http		= require('http');
var Controller	= require('./controller');
var middleware	= {};


var Calvin = new Class({

	Implements: Options,

	options: {
		name: 'Calvin App',
		environment: process.env.NODE_ENV,
		engine: 'beard',
		directory: '',
		maxAge: 86400000,
		controllers: '/controllers/',
		cache: [],
		middleware: [], // ['parser','assets','router']
		combine: {}
	},

	initialize: function(options){
		console.log('\nInitializing a new Calvin app ...');
		this.setOptions(options);

		this.stack = this.options.middleware.map(function(ware){
			var mod = ware.capitalize();
			this[ware] = new middleware[mod](this.options);
			return this[ware];
		}, this);
	},

	addMiddleware: function(ware){
		if (!this.stack) this.stack = [];
		this.stack.push(ware);
	},

	createServer: function(){
		if (arguments.length) this.stack = Array.from(arguments);
		return http.createServer(this.handler.bind(this));
	},

	logger: function(request, response){
		var duration = new Date - request.started;
		console.log(request.method + ' ' + (request.calvin.hasOwnProperty('asset') ? request.calvin.asset : '') + ' "' + request.url + '" took ' + duration + 'ms');

		if (request.calvin.hasOwnProperty('route')) {
			console.log('  --> route: ' + request.calvin.route.route);
			console.log('  --> controller: ' + request.calvin.route.controller);
			console.log('  --> action: ' + request.calvin.route.action);
			console.log('  --> args: ' + JSON.stringify(request.calvin.matches));

			if (request.calvin.hasOwnProperty('view')) {
				console.log('  --> render:');
				console.log('    --> view: ' + request.calvin.view);
				console.log('    --> layout: ' + request.calvin.layout);
				console.log('    --> engine: ' + request.calvin.engine);
			}
		}
	},

	handler: function(request, response){
		var stack = this.stack;
		request.calvin = {};
		request.started = new Date;
		if (process.env.NODE_ENV == 'development') request.on('end', this.logger.bind(this, request, response));

		var nextFn = function(index){
			var ware = stack[index + 1];
			return ware ? ware.handler.bind(ware, request, response, nextFn(index + 1)) : null;
		}

		try {
			var ware = stack[0];
			ware.handler.bind(ware, request, response, nextFn(0))();
		} catch(err) {
			new Controller(request, response, this.options).error(err);
		}
	}

});


fs.readdirSync(__dirname + '/middleware').forEach(function(item){
	if (!/\.js$/.test(item)) return;
	var name = item.replace('.js', '');
	var mod = require('./middleware/' + name);
	exports[name.capitalize()] = mod;
	middleware[name.capitalize()] = mod;
});


exports.Config = Calvin;
exports.Controller = Controller;

