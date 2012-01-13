

require('../deps/mootools/loader');

var fs 			=	require('fs');
var http 		= 	require('http');

var Vhosts 		=	require('./middleware/vhosts');
var Pathfinder 	=	require('./middleware/pathfinder');
var Assets 		=	require('./middleware/assets');
var Router 		=	require('./middleware/router');
// var Sessions 	= 	require('./middleware/sessions');
// var Parser 		= 	require('./middleware/parser');

var Controller 	=	require('./controller');
var JSONLY 		= 	require('./jsonly');


var Calvin = new Class({

	Implements: Options,

	options: {
		name: 'Calvin App',
		environment: process.env.NODE_ENV,
		engine: 'beard',
		directory: '',
		maxAge: 86400000,
		controllers: '/controllers/',
		authenticate: false,
		db: false,
		cache: [],
		combined: {
			js: false,
			css: false
		}
	},

	initialize: function(options, passware){
		console.log('\nInitializing a new Calvin app ...');
		this.setOptions(options);
        
		console.log(this.options.environment);
		console.log('process.env.NODE_ENV ' + process.env.NODE_ENV);

		if (passware) return;

		this.Assets = new Assets(this.options);
		this.router = new Router(this.options, this.Assets.cache);
		this.middleware.stack = [this.Assets, this.router];

		if (this.options.authenticate !== false) this.middleware.stack = [this.Assets, this.options.authenticate, this.router];
	},

	middleware: {

		stack: [],

		add: function(ware){
			console.log(this);
			// push to middleware array for vhost
			if (!this.stack) this.stack = [];
			this.stack.push(ware);
		}
	},

	addMiddleware: function(ware){
		// push to middleware array for vhost
		if (!this.middleware.stack) this.middleware.stack = [];
		this.middleware.stack.push(ware);
	},

	createServer: function(){
		if (arguments.length) this.middleware.stack = Array.from(arguments);
		return http.createServer(this.handler.bind(this));
	},

	handler: function(req, res){
//		req.on('end', function(chunk) {
//			console.log('Request has been handled\n');
//		});

		var getNext = function(stack, index, req, res){
			var ware = stack[index + 1];
			return ware ? ware.handler.bind(ware, req, res, getNext(stack, index + 1, req, res)) : null;
		}

		try {
			var stack = this.middleware.stack;
			stack.each(function(ware, index){
				var next = getNext(stack, index, req, res);
				var ready = ware.handler.bind(ware, req, res, next);
				if (!index) ready();
			});
		} catch(err) {
			req.e = err;
			console.log(JSON.stringify(err));
		}
	}

});


// module.exports = Calvin;
exports.Config = Calvin;

exports.Vhosts = Vhosts;
exports.Pathfinder = Pathfinder;
exports.Assets = Assets;
exports.Router = Router;

exports.Controller = Controller;
//exports.Sessions = Sessions;

exports.JSONLY = JSONLY;