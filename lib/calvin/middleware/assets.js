

var fs = require('fs');
var mime = require('mime');
var uglifyjs = require('uglify-js');
var sqwish = require('sqwish');
var zlib = require('zlib');


var Assets = function(app){
	console.log('--> Initializing Cache middleware...');
	this.app = app;

	this.defaultAssets();

	this.app.cache.forEach(function(dir){
		this.cacheDirectory(dir);
	}.bind(this));

	this.combineAssets();
};


Assets.prototype = {

	defaultAssets: function(){
		['403', '404', '500', 'error'].forEach(function(status){
			this.storeFile(__dirname + '/../public/'+ status +'.html', '/views/calvin/'+ status +'.html');
		}.bind(this));

		this.storeFile(__dirname + '/../public/errors.css', '/public/calvin/errors.css');
		this.storeFile(__dirname + '/../public/favicon.ico', '/public/favicon.ico');
	},

	cacheDirectory: function(dir){
		var directory = this.app.directory + dir;

		fs.readdirSync(directory).forEach(function(item){
			if (item.charAt(0) === '.') return;

			var path = directory + item;
			var key = dir + item;

			if (fs.statSync(path).isDirectory()) this.cacheDirectory(key + '/')
			else this.storeFile(path, key);
		}.bind(this));
	},

	minFile: function(path, type){
		var data = fs.readFileSync(path, 'UTF-8');

		switch(type) {
			case 'text/css': 				return new Buffer(sqwish.minify(data));
			case 'application/javascript': 	return new Buffer(uglifyjs.minify(data, {fromString: true}).code);
			case 'text/html': 				return data;
			default: 						return fs.readFileSync(path);
		}
	},

	buildAsset: function(type, stats, body){
		var mtime = stats.mtime.toUTCString();
		
		return {
			headers: {
				'Content-Type': type,
//				'Content-Length': body.length,
//				'length': type == 'text/html' ? new Buffer(body).length : body.length,
				'ETag': '"' + mtime + '"',
				'Last-Modified': mtime,
				'Cache-Control': 'public'
			},
			body: body
		};
	},

	storeFile: function(path, key){
		var type = mime.lookup(path);
		var body = this.minFile(path, type);
		var stats = fs.statSync(path);
		var asset = this.buildAsset(type, stats, body);

		if (type != 'text/html') {
			zlib.gzip(asset.body, function(err, buffer){
				if (err) throw err;
				asset.gzip = buffer;
			});
		}

		this.app.cache[key] = asset;

		if (this.app.environment == 'development') {
			fs.unwatchFile(path);
	
			fs.watchFile(path, function(prev, curr){
				if (curr.mtime.getTime() - prev.mtime.getTime()) {
					console.log('Recaching new ' + path + ' file');
					this.storeFile(path, key);
					this.combineAssets(path.replace(this.app.directory + '/public',''));
				}
			}.bind(this));
		}
	},

	combineAssets: function(file){
		for (var route in this.app.combine) {
			var files = this.app.combine[route];
			if (file == null || (file && files.contains(file))) this.combine(route, files);
		}
	},

	combine: function(route, files){
		console.log('\nCompressing ' + files.length + ' files below into --> ' + route + '\n');
		console.log(files);
		console.log('\n');

		var results = '';

		files.forEach(function(path){
			results += '' + this.app.cache['/public' + path].body.toString('UTF-8');
		}.bind(this));

		var buff = new Buffer(results);
		this.app.cache['/public' + route] = this.buildAsset(mime.lookup(route), {mtime: new Date()}, buff);

		// gzip the combined results
		// and set the gzip property of the cached asset
		var asset = this.app.cache['/public' + route];

		if (asset['Content-Type'] != 'text/html') {

			zlib.gzip(buff, function(err, buffer){
				if (err) throw err;
				asset.gzip = buffer;
				// ADD CONTENT LENGTH HERE
			});
		}
	},

	handler: function(request, response, next){
		var url = unescape(request.url);
		var asset = this.app.cache['/public' + url];

		if (asset && !url.test(/^\/views/)) {
			// if memcached asset --> response.serve
			request.calvin.asset = 'memcache';
			response.serve(asset);
		} else if (url.test(this.app.publics)) {
			// is public but not cached
			
			var dir = url.replace(/\/$/, '').split('/');
			if (dir[dir.length - 1].indexOf('.') === -1) {
//			if (url.replace(/\/$/, '').split('/').length == 2) {
				// trying to access a forbidden folder --> response.error 403
				throw new Error('403');
			}

			var path = this.app.directory + '/public' + url;

			fs.readFile(path, function(err, contents){
				// else if its a public route --> response.serveUncached
				if (err) {
					response.error(err, '404', this.app);
				} else {
					request.calvin.asset = 'uncached';
					response.end(contents);
//					fs.stat(path, function(err, stats){
//						var asset = this.buildAsset(mime.lookup(path), stats, contents);
//						response.serve(asset);
//						response.end(contents);
//					}.bind(this));
				}
			}.bind(this));


		} else if (next) {
			next();
		}
	}

};


module.exports = Assets;