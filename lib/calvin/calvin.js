

require('../deps/mootools/loader');

var fs			= require('fs');
var http		= require('http');
var resp		= require('./response');
var req			= require('./request');
var middleware	= {};


var Calvin = function(options){
	console.log('\nInitializing a new Calvin app ...');

	options.publicDirs = this.publicRegex(options.directory + '/public/');

	for (var prop in options) this.options[prop] = options[prop];

	this.stack = this.options.middleware.map(function(ware){
		var mod = ware.capitalize();
		this[ware] = new middleware[mod](this.options);
		return this[ware];
	}, this);
};


Calvin.prototype = {

	options: {
		name: 'Calvin App',
		environment: process.env.NODE_ENV,
		engine: 'beard',
		directory: '',
		maxAge: 86400000,
		cache: [],
		middleware: [], // ['parser','assets','router']
		combine: {},
		publicDirs: false
	},

	get: function(route, fn){
		this['router'].get(route, fn);
	},
	
	post: function(route, fn){
		this['router'].post(route, fn);
	},

	use: function(ware){
		if (!this.stack) this.stack = [];
		this.stack.push(ware);
	},

//	listen: function(port){
//		http.createServer(this.handler.bind(this)).listen(port);
//	},

	createServer: function(){
		if (arguments.length) this.stack = Array.from(arguments);
		this.server = http.createServer(this.handler.bind(this));
		return this.server;
	},

	listen: function(port){
		if (this.server) this.server.listen(port)
		else this.createServer().listen(port);
	},

	publicRegex: function(pub){
		if (fs.existsSync(pub)) {
			var publics = fs.readdirSync(pub).filter(function(item){
				return item.charAt(0) !== '.';
			});

			return '(' + publics.toString().replace(/,/gi, '|') + ')';
		} else {
			return false;
		}
	},

	handler: function(request, response){
		for (var prop in req) request[prop] = req[prop];
		for (var prop in resp) response[prop] = resp[prop];

		request.calvin = {};
		request.started = new Date;
		response.request = request;
		response.cache = this.options.cache;
		response.engine = this.options.engine;
//		request.on('end', this.logger.bind(this, request, response));

		var stack = this.stack;

		var nextFn = function(index){
			var ware = stack[index + 1];
			return ware ? ware.handler.bind(ware, request, response, nextFn(index + 1)) : null;
		}

		try {
			var ware = stack[0];
			ware.handler.bind(ware, request, response, nextFn(0))();
		} catch(err) {
			console.log(err);
			response.error(err);
		}
	}

};


fs.readdirSync(__dirname + '/middleware').forEach(function(item){
	if (!/\.js$/.test(item)) return;
	var name = item.replace('.js', '');
	var mod = require('./middleware/' + name);
	exports[name.capitalize()] = mod;
	middleware[name.capitalize()] = mod;
});


module.exports = Calvin;