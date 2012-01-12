

var fs 			= require('fs');
var mime 		= require('mime');

var jsmin 		= require('./../../deps/min/jsmin').minify;
var cssmin 		= require('./../../deps/min/cssmin').minify;


var Assets = new Class({

//	options: {
//		directory: '',
//		max_age: (86400000 / 1000),
//		cache: [],
//		combined: {
//			js: false,
//			css: false
//		}
//	},

	cache: {},
	
	initialize: function(options) {
		console.log('--> Initializing Cache middleware...');
		this.options = options;

		this.options.cache.forEach(function(dir) {
			this.cacheDirectory(dir);
		}.bind(this));

		for (var type in this.options.combined) this.combineAssets(type);

		this.storeFile(__dirname + '/../error.html', '/views/error.html');
		this.publicRegex();
	},

	publicRegex: function() {
		var dirs = [];
//		var pub = this.options.directory;
		var pub = this.options.directory + '/public/';

		fs.readdirSync(pub).forEach(function(item) {
			if (item.charAt(0) == '.') return;
			if (fs.statSync(pub + item).isDirectory()) dirs.push(item);
		}.bind(this));

		var regex = '^\/(' + dirs.toString().replace(/,/gi, '|') + ')';
		this.public_paths = new RegExp(regex);
	},

	cacheDirectory: function(dir) {
		var directory = this.options.directory + dir;

		fs.readdirSync(directory).forEach(function(item) {
			if (item.charAt(0) == '.') return;

			var path = directory + item;
			var key = dir + item;

			if (fs.statSync(path).isDirectory()) this.cacheDirectory(key + '/')
			else this.storeFile(path, key);

		}.bind(this));
	},

	minFile: function(path, type) {
		var data = fs.readFileSync(path, 'UTF-8');

		switch(type) {
			case 'text/css': 				return new Buffer(cssmin(data));
//			case 'application/javascript': 	return new Buffer(data);
			case 'application/javascript': 	return new Buffer(jsmin(data));
			case 'text/html': 				return data;
//			case 'text/html': 				return data.clean();
			default: 						return fs.readFileSync(path);
		}
	},

	buildAsset: function(type, stats, body) {
		return {
			'Content-Type': type,
			'Last-Modified': stats.mtime.toUTCString(),
			length: type == 'text/html' ? new Buffer(body).length : body.length,
			body: body,
			'Cache-Control': 'public, max-age=' + this.options.max_age
		};
	},

	storeFile: function(path, key) {
		var type = mime.lookup(path);
		var body = this.minFile(path, type);
		var stats = fs.statSync(path);
		
		this.cache[key] = this.buildAsset(type, stats, body);

		if (this.options.environment == 'development') {
			fs.unwatchFile(path);
	
			fs.watchFile(path, function(prev, curr) {
				if (curr.mtime.getTime() - prev.mtime.getTime()) {
					console.log('Recaching new ' + path + ' file');
					this.storeFile(path, key);
					this.combineAssets(type === 'text/css' ? 'css' : 'js');
//					this.combineAssets('js');
//					this.combineAssets('css');
				}
			}.bind(this));
		}
	},

	combineAssets: function(type) {
		if (!this.options.combined[type].files) return;
//		console.log('\n\nCombining ' + this.options.combined[type].files + ' ' + type.toUpperCase() + ' Files for: ' + this.options.combined[type].route + ' route');

		var results = '';

		this.options.combined[type].files.forEach(function(file) {
			var path = this.options.combined[type].path + file;
			results += this.cache['/public' + path].body.toString('UTF-8');
		}.bind(this));

		var buff = new Buffer(results);

		var content_type = (type == 'css') ? 'text/css' : 'application/javascript';
		this.cache[this.options.combined[type].route] = this.buildAsset(content_type, {mtime: new Date()}, buff);
	},

	serve: function(req, res, asset) {

		res.writeHead(200, {
//			'Accept-Encoding': 'compress, gzip',
			'Content-Type': asset['Content-Type'],
			'Content-Length': asset['length'],
//			'Content-Length': asset['Content-Type'] == 'text/html' ? new Buffer(asset.body).length : asset.length,
			'Date': new Date().toUTCString(),
			'Last-Modified': asset['Last-Modified'],
			'Cache-Control': asset['Cache-Control']
		});

		res.end(asset.body);
	},

	handler: function(req, res, next) {
		var url = req.url;

//		console.log('requesting file: ' + req.url);

		if (this.cache[url] && !url.test(/views/)) {
//			cached
			this.serve(req, res, this.cache[url]);
		} else if (this.cache['/public' + url]) {
//			cached
			this.serve(req, res, this.cache['/public' + url]);
		} else if (req.url.test(this.public_paths)) {
//			uncached
			var file = this.options.directory + '/public' + unescape(req.url);

			fs.readFile(file, function(err, contents) {
				if (err) {
					res.writeHead(404);
					res.end();
				} else {
					fs.stat(file, function(err, stats){
						var asset = this.buildAsset(mime.lookup(file), stats, contents);
						this.serve(req, res, asset);
					}.bind(this));
				}
			}.bind(this));
		} else if (next) {
			next();
		}
	}

});


module.exports = Assets;

