

var fs = require('fs');
var mime = require('mime');
var uglifyjs = require('uglify-js');
var sqwish = require('sqwish');
var zlib = require('zlib');
var less = require('less');
var utils = require('../utils');


var Assets = function(app){
    console.log('Initializing Assets middleware...');
    this.app = app;
    this.settings = app.settings;
    this.public = {
        files: {},
        directories: {}
    };

    if (this.settings.views.path) {
        this.settings.assets.paths.push(this.settings.views.path);
    } else if (utils.exists(this.settings.directory + '/views/')) {
        this.settings.assets.paths.push('/views/');
    }

    this.defaults();
    this.settings.assets.paths.forEach(this.cache, this);
    this.getPublicPaths('/public/');
    this.press();
}


Assets.prototype = {

    walkPublic: function(dir){
        var pub = this.settings.directory + dir;
        fs.readdirSync(pub).forEach(function(item){
            if (item.charAt(0) === '.') return;
            var path = pub + item;
            var key = dir + item;
            if (fs.statSync(path).isDirectory()) {
                this.walkPublic(key + '/');
                this.public.directories[key.replace('/public', '')] = true;
            } else {
                this.public.files[key.replace('/public', '')] = true;
            }
        }, this);
    },

    getPublicPaths: function(dir){
        this.walkPublic(dir);
        for (var route in this.settings.assets.press) {
            this.public.files[route] = true;
        }
        return this.public;
    },

    defaults: function(){
        this.store(__dirname + '/../public/status.html', '/views/calvin/status.html');
        this.store(__dirname + '/../public/trace.html', '/views/calvin/trace.html');
        this.store(__dirname + '/../public/errors.css', '/calvin/errors.css');
        this.store(__dirname + '/../public/favicon.ico', '/favicon.ico');
    },

    cache: function(dir){
        var pub = this.settings.directory + dir;

        fs.readdirSync(pub).forEach(function(item){
            if (item.charAt(0) === '.') return;
            var path = pub + item;
            var key = dir + item;
            if (fs.statSync(path).isDirectory()) this.cache(key + '/')
            else this.store(path, key.replace(/^\/public/, ''));
        }, this);
    },

    getBody: function(path, type){
        var body = fs.readFileSync(path, 'utf8');
        var troubleshooting = this.settings.troubleshooting;
        if (path.contains('.less')) type = 'text/less';

        switch (type) {
            case 'text/css':                    return troubleshooting ? body : sqwish.minify(body);
            case 'text/less':                   return body;
            case 'application/javascript':      return troubleshooting ? body : uglifyjs.minify(body, {fromString: true}).code;
            case 'text/html':                   return troubleshooting ? body : body.clean();
            default:                            return fs.readFileSync(path);
        }
    },

    buildAsset: function(type, stats, body, lesscss){
        var mtime = stats.mtime.toUTCString();
        var asset = {
            headers: {
                'Content-Type': type,
                'Vary': 'Accept-Encoding'
            },
            body: lesscss || body
        };

        if (type == 'text/html') {
            asset.headers['Cache-Control'] = 'no-cache';
        } else {
            asset.headers['Cache-Control'] = 'public';
            asset.headers['Content-Encoding'] = 'gzip';
            asset.headers['ETag'] = '"' + mtime + '"';
            asset.headers['Last-Modified'] = mtime;

            if (lesscss || type == 'text/css' || type == 'application/javascript') {
                asset.string = body;
            }

            zlib.gzip(lesscss || body, function(err, buffer){
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

        this.app.cache[key] = this.buildAsset(type, stats, body, path.contains('.less') ? body : null);

        if (this.settings.assets.watch) {
            fs.unwatchFile(path);
            fs.watchFile(path, function(prev, curr){
                if (utils.exists(path)) {
                    if (curr.mtime.getTime() - prev.mtime.getTime()) {
                        console.log('Recaching "' + path + '"');
                        this.store(path, key);
                        this.press(key);
                    }
                } else {
                    console.log('deleting "' + key + '" from cache');
                    delete this.app.cache[key];
                }

                if (this.app.memcache) this.app.memcache.empty();
            }.bind(this));
        }
    },

    press: function(file){
        for (var key in this.settings.assets.press) {
            var files = this.settings.assets.press[key];
            if (file == null || (file && files.contains(file))) {
                console.log('\nCompressing these ' + files.length + ' files into "' + key + '"\n');
                console.log(files);

                var body = '';
                var hasLess, lesscss;

                files.forEach(function(path, f){
                    body += '\n' + this.app.cache[path].string;
                    if (path.contains('.less')) hasLess = true;
                }, this);

                if (hasLess) {
                    lesscss = sqwish.minify(less.renderSync(body));
                }

                this.app.cache[key] = this.buildAsset(mime.lookup(key), { mtime: new Date() }, body, lesscss);
            }
        }
    },

    handler: function(request, response, next){
        var url = request.pathname;

        if (this.public.files[url]) {
            request.calvin.asset = 'uncached';
            fs.createReadStream(this.settings.directory + '/public' + url).pipe(response);

        } else if (this.public.directories[url]) {
            throw new Error(403);

        } else {
            next();
        }
    }
};


less.renderSync = function(input){
    var css;
    this.render(input, { sync: true }, function(err, result){
        if (err) throw err;
        css = result.css;
    });
    return css;
}


module.exports = function(app){
    return new Assets(app);
}
