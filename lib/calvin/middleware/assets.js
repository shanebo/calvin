

var fs 		= require('fs');
var mime 	= require('mime');
var jsmin 	= require('./../../deps/min/jsmin').minify;
var cssmin 	= require('./../../deps/min/cssmin').minify;


var Assets = new Class({

	initialize: function(options){
		console.log('--> Initializing Cache middleware...');
		this.options = options;

		this.options.cache.forEach(function(dir){
			this.cacheDirectory(dir);
		}.bind(this));

		this.combineAssets();
		this.storeFile(__dirname + '/../error.html', '/views/error.html');
		this.publicRegex();
	},

	publicRegex: function(){
		var dirs = [];
		var pub = this.options.directory + '/public/';

		fs.readdirSync(pub).forEach(function(item){
			if (item.charAt(0) == '.') return;
			if (fs.statSync(pub + item).isDirectory()) dirs.push(item);
		}.bind(this));

		var regex = '^\/(' + dirs.toString().replace(/,/gi, '|') + ')';
		this.public_paths = new RegExp(regex);
	},

	cacheDirectory: function(dir){
		var directory = this.options.directory + dir;

		fs.readdirSync(directory).forEach(function(item){
			if (item.charAt(0) == '.') return;

			var path = directory + item;
			var key = dir + item;

			if (fs.statSync(path).isDirectory()) this.cacheDirectory(key + '/')
			else this.storeFile(path, key);

		}.bind(this));
	},

	minFile: function(path, type){
		var data = fs.readFileSync(path, 'UTF-8');

		switch(type) {
			case 'text/css': 				return new Buffer(cssmin(data));
//			case 'application/javascript': 	return new Buffer(data);
			case 'application/javascript': 	return new Buffer(jsmin(data));
			case 'text/html': 				return data;
			default: 						return fs.readFileSync(path);
		}
	},

	buildAsset: function(type, stats, body){
		return {
			headers: {
				'Content-Type': type,
				'length': type == 'text/html' ? new Buffer(body).length : body.length,
				'Last-Modified': stats.mtime.toUTCString(),
				'Cache-Control': 'public, max-age=' + this.options.max_age
			},
			body: body
		};
	},

	storeFile: function(path, key){
		// do a find and replace regex on ../../ so I can load up higher level universally used assets
		var type = mime.lookup(path);
		var body = this.minFile(path, type);
		var stats = fs.statSync(path);
		
		this.options.cache[key] = this.buildAsset(type, stats, body);

		if (this.options.environment == 'development') {
			fs.unwatchFile(path);
	
			fs.watchFile(path, function(prev, curr){
				if (curr.mtime.getTime() - prev.mtime.getTime()) {
					console.log('Recaching new ' + path + ' file');
					this.storeFile(path, key);
					this.combineAssets(path.replace(this.options.directory + '/public',''));
				}
			}.bind(this));
		}
	},

	combineAssets: function(file){
		for (var route in this.options.combine) {
			var files = this.options.combine[route];
			if (file == null || (file && files.contains(file))) this.combine(route, files);
		}
	},

	combine: function(route, files){
		console.log('\n\nCombining ' + files + ' to ' + route + ' route');
		var results = '';

		files.forEach(function(path){
			results += this.options.cache['/public' + path].body.toString('UTF-8');
		}.bind(this));

		var buff = new Buffer(results);
		this.options.cache['/public' + route] = this.buildAsset(mime.lookup(route), {mtime: new Date()}, buff);
	},

	serve: function(request, response, asset){
		if (request.headers['if-modified-since']) {
			
			console.log('request.headers["if-modified-since"] ' + request.headers['if-modified-since']);
			
			var modified_since = new Date(request.headers['if-modified-since']);
			var last_modified = new Date(asset['Last-Modified']);
			
			if (last_modified >= modified_since) {
				response.statusCode(304);
				response.end();
				return;
			}
		}

//		'Accept-Encoding': 'compress, gzip',
		asset.headers['Date'] = new Date().toUTCString();
		response.writeHead(200, asset.headers);
		response.end(asset.body);
	},

	handler: function(request, response, next){
		var url = request.url;
		var file = this.options.cache['/public' + url];

		if (file && !url.test(/views/)) {
			request.calvin.asset = 'cached';
			this.serve(request, response, file);

		} else if (url.test(this.public_paths)) {
			var path = this.options.directory + '/public' + unescape(url);

			fs.readFile(path, function(err, contents){
				if (err) {
					response.writeHead(404);
					response.end();
				} else {
					request.calvin.asset = 'uncached';

					fs.stat(path, function(err, stats){
						var asset = this.buildAsset(mime.lookup(path), stats, contents);
						this.serve(request, response, asset);
					}.bind(this));
				}
			}.bind(this));

		} else if (next) {
			next();
		}
	}

});


module.exports = Assets;

