

var fs = require('fs');
var mime = require('mime');
var uglifyjs = require('uglify-js');
var sqwish = require('sqwish');
var zlib = require('zlib');
var sass = require('node-sass');
var app;


var Assets = function(settings){
	console.log('Initializing Assets middleware...');
	
	app = settings;
	app.publics = this.publicRegex('/public/');
	app.memcache.assets.push('/views/');
	app.memcache.assets.forEach(this.cache, this);

	this.defaults();
	this.press();
}


Assets.prototype = {

	walkPublic: function(dir, dirs, files){
		fs.readdirSync(app.directory + dir).forEach(function(item){
			if (item.charAt(0) === '.') return;
			var path = app.directory + dir + item;
			var key = dir + item;
			if (fs.statSync(path).isDirectory()) {
				this.walkPublic(key + '/', dirs, files);
				dirs.push(key.replace('/public', ''));
			} else {
				files.push(key.replace('/public', ''));
			}
		}, this);
	},

	publicRegex: function(dir){
		var pub = app.directory + dir;
		if (!fs.existsSync(pub)) return false;

		var dirs = [];
		var files = [];

		this.walkPublic(dir, dirs, files);
		for (var route in app.combine) files.push(route);

		var folders = dirs.slice(0);
		folders.push(dir);

		folders.forEach(function(f){
			fs.unwatchFile(app.directory + f);
			fs.watchFile(app.directory + f, function(prev, curr){
				if (curr.mtime.getTime() - prev.mtime.getTime()) {
					app.publics = this.publicRegex(f);
					console.log('Publics updated to:');
					console.log(app.publics);
				}
			}.bind(this));
		}, this);

		return {
			directories: new RegExp('^' + dirs.join('$|^') + '$'),
			files: new RegExp('^' + files.join('$|^') + '$')
		};
	},

	defaults: function(){
		this.store(__dirname + '/../public/status.html', '/views/calvin/status.html');
		this.store(__dirname + '/../public/trace.html', '/views/calvin/trace.html');
		this.store(__dirname + '/../public/errors.css', '/calvin/errors.css');
		this.store(__dirname + '/../public/favicon.ico', '/favicon.ico');
	},

	cache: function(dir){
		var directory = app.directory + dir;

		fs.readdirSync(directory).forEach(function(item){
			if (item.charAt(0) === '.') return;
			var path = directory + item;
			var key = dir + item;
			if (fs.statSync(path).isDirectory()) this.cache(key + '/')
			else this.store(path, key.replace(/^\/public/, ''));
		}, this);
	},

	getBody: function(path, type){
		var body = fs.readFileSync(path, 'utf8');
		var dev = app.environment === 'development';
		if (path.contains('.scss')) type = 'text/scss';

		switch (type) {
			case 'text/css': 				return sqwish.minify(body);
			case 'text/scss': 				return body;
			case 'application/javascript':	return dev ? body : uglifyjs.minify(body, {fromString: true}).code;
			case 'text/html': 				return dev ? body : body.clean();
			default: 						return fs.readFileSync(path);
		}
	},

	buildAsset: function(type, stats, body, scss){
		var mtime = stats.mtime.toUTCString();
		var asset = {
			headers: {
				'Content-Type': type
			},
			body: scss || body
		};

		if (type == 'text/html') {
			asset.headers['Cache-Control'] = 'no-cache';
		} else {
			asset.headers['Cache-Control'] = 'public';
			asset.headers['Content-Encoding'] = 'gzip';
			asset.headers['ETag'] = '"' + mtime + '"';
			asset.headers['Last-Modified'] = mtime;

			if (scss || type == 'text/css' || type == 'application/javascript') {
				asset.string = body;
			}

			zlib.gzip(scss || body, function(err, buffer){
				if (err) throw err;
				asset.body = buffer;
				asset.headers['Content-Length'] = buffer.length;
			});
		}

		return asset;
	},

	store: function(path, key){
		var type = mime.lookup(path);
		var body = this.getBody(path, type);
		var stats = fs.statSync(path);

		app.cache[key] = this.buildAsset(type, stats, body, path.contains('.scss') ? body : null);

		if (app.environment === 'development') {
			fs.unwatchFile(path);
			fs.watchFile(path, function(prev, curr){
				if (fs.existsSync(path)) {
					if (curr.mtime.getTime() - prev.mtime.getTime()) {
						console.log('Recaching "' + path + '"');
						this.store(path, key);
						this.press(key);
					}
				} else {
					console.log('deleting "' + key + '" from cache');
					delete app.cache[key];
				}

				if (app.memcache) app.memcache.empty();
			}.bind(this));
		}
	},

	press: function(file){
		for (var key in app.combine) {
			var files = app.combine[key];
			if (file == null || (file && files.contains(file))) {
				console.log('\nCompressing these ' + files.length + ' files into "' + key + '"\n');
				console.log(files);

				var body = '';
				var hasScss, scss;

				files.forEach(function(path, f){
					body += ' ' + app.cache[path].string;
					if (path.contains('.scss')) hasScss = true;
				}, this);

				if (hasScss) {
					scss = sqwish.minify(sass.renderSync({ data: body }).css.toString());
				}

				app.cache[key] = this.buildAsset(mime.lookup(key), { mtime: new Date() }, body, scss);
			}
		}
	},

	handler: function(request, response, next){
		var url = request.pathname;

		if (app.publics.files.test(url)) {
			request.calvin.asset = 'uncached';
			fs.createReadStream(app.directory + '/public' + url).pipe(response);

		} else if (app.publics.directories.test(url)) {
			var dir = url.replace(/\/$/, '').split('/');
			if (dir[dir.length - 1].indexOf('.') === -1) throw new Error(403);

		} else {
			next();
		}
	}

};


module.exports = function(options){
	return new Assets(options);
}