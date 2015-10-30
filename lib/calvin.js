

require('../deps/mootools-core-1.4.5-server.js');
require('../deps/mootools-more-1.4.0.1.js');


var fs = require('fs');
var http = require('http');
var res	= require('./response');
var req = require('./request');
var url = require('url');


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

	get: function(){
		this.router.get.apply(this.router, arguments);
	},
	
	post: function(){
		this.router.post.apply(this.router, arguments);
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
		var protocol = request.connection.encrypted ? 'https://' : 'http://';
		var fullUrl = protocol + request.headers.host + request.url;
		var parsed = url.parse(fullUrl);

		for (var prop in req)	request[prop] = req[prop];
		for (var prop in res)	response[prop] = res[prop];
		for (var prop in parsed) {
			if (parsed.hasOwnProperty(prop)) {
				request[prop] = parsed[prop];
			}
		}

		request.calvin = {};
		request.started = new Date;
		request.query = {};
		request.params = {};

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
			next(-1)();
		} catch(err) {
			response.error(err, err.message);
		}
	}
};


module.exports = function(options){
	return new Calvin(options);
}