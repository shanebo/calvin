
require('../deps/mootools-core-1.4.5-server.js');

var fs			= require('fs');
var http		= require('http');
var resp		= require('./response');
var req			= require('./request');
var middleware	= {};


var Calvin = function(options){
	console.log('\nInitializing a new Calvin app ...');

	for (var prop in options) this.options[prop] = options[prop];

	var pub = options.directory + '/public/';

	this.options.publics = this.publicRegex(pub);

	fs.watchFile(pub, function(prev, curr){
		if (curr.mtime.getTime() - prev.mtime.getTime()) {
			console.log('creating new publics regex');
			this.options.publics = this.publicRegex(pub);
			console.log(this.options.publics);
		}
	}.bind(this));

	fs.readdirSync(__dirname + '/middleware').forEach(function(item){
		if (!/\.js$/.test(item)) return;
		var name = item.replace('.js', '');
		var ware = require('./middleware/' + name);
		this[name] = new ware(this.options);
//		exports[name.capitalize()] = mod;
//		middleware[name] = mod;
//		middleware[name.capitalize()] = mod;
//		var mod = ware;
	}.bind(this));

//	this.stack = this.options.middleware.map(function(ware){
//		return this[ware];
//	}, this);
};



Calvin.prototype = {

	options: {
		name: 'Calvin App',
		environment: process.env.NODE_ENV || 'production',
		engine: 'beard',
		directory: '',
		maxAge: 86400000,
		cache: [],
		middleware: [], // ['parser','assets','router']
		combine: {},
		publics: false
	},

	get: function(route, fn){
		this['router'].get(route, fn);
	},
	
	post: function(route, fn){
		this['router'].post(route, fn);
	},

	use: function(ware){
		if (!this.stack) this.stack = [];
		if (typeof ware === 'function') {
			ware = {
				handler: ware
			}
		}
		this.stack.push(ware);
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

	publicRegex: function(pub){
		if (fs.existsSync(pub)) {
			var publics = fs.readdirSync(pub).filter(function(item){
				return item.charAt(0) !== '.';
			});

			return '(^/' + publics.clean().join('|^/') + ')';
		} else {
			return false;
		}
	},

	handler: function(request, response){
		for (var prop in req) request[prop] = req[prop];
		for (var prop in resp) response[prop] = resp[prop];

		request.calvin = {};
		response.request = request;
		response.cache = this.options.cache;
		response.engine = this.options.engine;
		response.on('error', function(err, status){
			response.error(err, status, this);
		}.bind(this));

		var stack = this.stack;

		var next = function(index){
			var ware = stack[index + 1];
			return ware ? ware.handler.bind(ware, request, response, next(index + 1)) : null;
		}

		try {
			var ware = stack[0];
			ware.handler.bind(ware, request, response, next(0))();
		} catch(err) {
			response.error(err, err.message, this);
		}
	}

};


exports.config = function(options){
	return new Calvin(options);
};

//module.exports = Calvin;