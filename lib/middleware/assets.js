

var fs = require('fs');
var mime = require('mime');
var uglifyjs = require('uglify-js');
var sqwish = require('sqwish');
var zlib = require('zlib');


var Assets = function(app){
	console.log('Initializing Assets middleware...');
	this.app = app;
	this.defaultAssets();
	this.app.cache.forEach(this.cacheDirectory.bind(this));
	this.combineAssets();
}


Assets.prototype = {

	defaultAssets: function(){
		this.storeFile(__dirname + '/../public/status.html', '/views/calvin/status.html');
		this.storeFile(__dirname + '/../public/trace.html', '/views/calvin/trace.html');
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
		}, this);
	},

	minFile: function(path, type){
		var data = fs.readFileSync(path, 'utf8');
		var dev = this.app.environment == 'development';
		switch (type) {
			case 'text/css': 				return new Buffer(sqwish.minify(data));
			case 'application/javascript': 	return dev ? data : new Buffer(uglifyjs.minify(data, {fromString: true}).code);
			case 'text/html': 				return dev ? data : data.clean();
			default: 						return fs.readFileSync(path);
		}
	},

	buildAsset: function(type, stats, body){
		var mtime = stats.mtime.toUTCString();
		var asset = {
			headers: {
				'Content-Type': type
			},
			body: body
		};

		if (type == 'text/html') {
			asset.headers['Cache-Control'] = 'no-cache';
		} else {
			asset.headers['Content-Encoding'] = 'gzip';
			asset.headers['Cache-Control'] = 'public';
//			asset.headers['Cache-Control'] = 'public, max-age=3600';
//			asset.headers['Expires'] = new Date().clone().increment('hour', 1).toUTCString();
			asset.headers['ETag'] = '"' + mtime + '"';
			asset.headers['Last-Modified'] = mtime;
		}

		return asset;
	},

	storeFile: function(path, key){
		var type = mime.lookup(path);
		var body = this.minFile(path, type);
		var stats = fs.statSync(path);
		var asset = this.buildAsset(type, stats, body);

		if (type != 'text/html') {
			zlib.gzip(asset.body, function(err, buffer){
				if (err) throw err;
				asset.body = buffer;
				asset.headers['Content-Length'] = buffer.length;
			});
		}

		this.app.cache[key] = asset;

		if (this.app.environment == 'development') {
			fs.unwatchFile(path);

			fs.watchFile(path, function(prev, curr){
				if (fs.existsSync(path)) {
					if (curr.mtime.getTime() - prev.mtime.getTime()) {
						console.log('Recaching new ' + path + ' file');
						this.storeFile(path, key);
						this.combineAssets(path.replace(this.app.directory + '/public', ''));
					}
				} else {
					delete this.app.cache[key];
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
		console.log('\nCompressing ' + files.length + ' files below into --> "' + route + '"\n');
		console.log(files);
		console.log('\n');

		var results = '';

		files.forEach(function(path){
			results += '' + this.app.cache['/public' + path].body.toString('utf8');
		}, this);

		var buff = new Buffer(results);
		this.app.cache['/public' + route] = this.buildAsset(mime.lookup(route), { mtime: new Date() }, buff);

		var asset = this.app.cache['/public' + route];

		zlib.gzip(buff, function(err, buffer){
			if (err) throw err;
			asset.body = buffer;
			asset.headers['Content-Length'] = buffer.length;
		});
	},

	handler: function(request, response, next){
		var url = unescape(request.url.split('?')[0]);
		var asset = this.app.cache['/public' + url];

		if (asset && !url.test(/^\/views/)) {
			// serve memcached asset
			request.calvin.asset = 'memcached';
			response.serve(asset);
		} else if (url.test(this.app.publics)) {
			// is public but not cached

			var dir = url.replace(/\/$/, '').split('/');
			if (dir[dir.length - 1].indexOf('.') === -1) {
				throw new Error(403);
			}

			var path = this.app.directory + '/public' + url;

			fs.readFile(path, function(err, contents){
				// serve uncached public asset
				if (err) {
					response.error(err, 404);
				} else {
					request.calvin.asset = 'uncached';
					response.end(contents);
				}
			}.bind(this));


		} else if (next) {
			next();
		}
	}

};


module.exports = function(options){
	return new Assets(options);
}