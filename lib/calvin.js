

require('../deps/mootools-core-1.4.5-server.js');
require('../deps/mootools-more-1.4.0.1.js');


var fs = require('fs');
var http = require('http');
var res	= require('./response');
var req = require('./request');
var url = require('url');
var qs = require('qs');


var Calvin = function(options){
	for (var prop in options) this.options[prop] = options[prop];
	console.log('\nInitializing ' + this.options.name + ' app');
	this.options.middleware.forEach(this.use, this);
}


Calvin.prototype = {

	stack: [],

	options: {
		name: 'Calvin',
		environment: process.env.NODE_ENV || 'production',
		engine: 'beard',
		directory: '',
		maxAge: 86400000,
		memcache: {
			assets: [],
			routes: []
		},
		cache: {},
		middleware: ['logger', 'assets', 'router'],
		combine: {},
		publics: false
	},

	get: function(route, fn){
		this.router.get(route, fn);
	},
	
	post: function(route, fn){
		this.router.post(route, fn);
	},

	loadMore: function(ware){
		var middleware = require('./middleware/' + ware)(this.options);
		if (['assets', 'router'].contains(ware)) this[ware] = middleware;
		return middleware;
	},

	use: function(ware){
		ware = (typeof ware === 'string') ? this.loadMore(ware) : { handler: ware };
		this.stack.push(ware);
		return this;
	},

	createServer: function(){
		if (arguments.length) this.stack = Array.from(arguments);
		this.server = http.createServer(this.handler.bind(this));
		return this.server;
	},

	listen: function(port){
		if (this.server) this.server.listen(port)
		else this.createServer().listen(port);
	},

	handler: function(request, response){
		var parsed = url.parse(request.url, true);

		for (var prop in req)	request[prop] = req[prop];
		for (var prop in res)	response[prop] = res[prop];
		for (var prop in parsed) {
			if (parsed.hasOwnProperty(prop)) {
				request[prop] = parsed[prop];
			}
		}

		request.host = request.headers.host.split(':')[0];
		request.calvin = {};
		request.started = new Date;
		request.params = {};
		request.query = qs.parse(parsed.query);

		response.request = request;
		response.app = this.options;
		response.publics = this.options.publics;
		response.cache = this.options.cache;
		response.engine = this.options.engine;
		response.on('error', response.error);

		var stack = this.stack;

		var next = function(s){
			var ware = stack[s + 1];
			return ware ? ware.handler.bind(ware, request, response, next(s + 1)) : function(){};
		}

		try {
			var ware = stack[0];
			ware.handler.bind(ware, request, response, next(0))();
		} catch(err) {
			response.error(err, err.message);
		}
	}
};


module.exports = function(options){
	return new Calvin(options);
}