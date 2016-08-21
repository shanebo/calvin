

'use strict';

const fs = require('fs');
const mime = require('mime');
const uglifyjs = require('uglify-js');
const sqwish = require('sqwish');
const zlib = require('zlib');
const less = require('less');
const utils = require('../utils');


const Cache = function(app){
    this.app = app;
    this.stash = app.stash;
    this.settings = app.settings;
    this.urls = app.settings.cache.urls;
    this.minify = app.settings.cache.minify;
    this.watch = app.settings.cache.watch;
    this.combinePaths = app.settings.cache.combine;
    this.public = {
        files: {},
        directories: {}
    };

    this.loadDefaults();
    this.loadFiles();
    this.combine();
    this.createLookup();
}


Cache.prototype = {

    loadFiles: function(){
        let root = this.settings.cache.public;
        if (root) {
            this.walk(root, 'paths');
            for (var route in this.combinePaths) {
                this.public.files[route] = true;
            }
        }

        ['views', 'assets', 'statics'].forEach(function(folder){
            let paths = this.settings.cache[folder];
            if (paths) {
                utils.toFlatArray(paths).forEach(this.walk, this);
            }
        }, this);
    },

    loadDefaults: function(){
        this.store(__dirname + '/../public/status.html', '/views/calvin/status.html');
        this.store(__dirname + '/../public/trace.html', '/views/calvin/trace.html');
        this.store(__dirname + '/../public/errors.css', '/calvin/errors.css');
        this.store(__dirname + '/../public/favicon.ico', '/favicon.ico');
    },

    walk: function(dir, type){
        var pub = this.settings.directory + dir;

        fs.readdirSync(pub).forEach(function(item){
            if (item.charAt(0) === '.') {
                return;
            }
            var path = pub + item;
            var key = dir + item;
            if (fs.statSync(path).isDirectory()) {
                this.walk(key + '/', type);
                if (['paths', 'both'].includes(type)) {
                    this.public.directories[key.replace('/public', '')] = true;
                }

            } else {
                if (['paths', 'both'].includes(type)) {
                    this.public.files[key.replace('/public', '')] = true;
                }

                if (!type || type == 'both') {
                    this.store(path, key.replace(/^\/public/, ''));
                }
            }
        }, this);
    },

    store: function(path, key){
        var type = mime.lookup(path);
        var body = this.getBody(path, type);
        var stat = fs.statSync(path);

        this.stash[key] = this.buildAsset(type, stat, body, path.includes('.less') ? body : null);

        if (this.watch) {
            fs.unwatchFile(path);
            fs.watchFile(path, function(prev, curr){
                if (utils.exists(path)) {
                    if (curr.mtime.getTime() - prev.mtime.getTime()) {
                        console.log('Recaching "' + path + '"');
                        this.store(path, key);
                        this.combine(key);
                    }
                } else {
                    console.log('deleting "' + key + '" from cache');
                    delete this.stash[key];
                }

                this.empty();
            }.bind(this));
        }
    },

    getBody: function(path, type){
        var body = fs.readFileSync(path, 'utf8');
        var minify = this.minify;

        switch (type) {
            case 'text/css':
                return minify ? sqwish.minify(body) : body;

            case 'text/less':
                return body;

            case 'application/javascript':
                return minify ? uglifyjs.minify(body, {fromString: true}).code : body;

            case 'text/html':
                return minify ? utils.removeExtraHtmlWhitespace(body) : body;

            default:
                // things like images, videos, etc.
                return fs.readFileSync(path);
        }
    },

    buildAsset: function(type, stat, body, lesscss){
        let mtime = stat.mtime.toUTCString();
        let asset = {
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

            // refactor this with includes array check
            if (lesscss || type == 'text/css' || type == 'application/javascript') {
                asset.string = body;
            }

            let buffer = zlib.gzipSync(lesscss || body);
            asset.body = buffer;
            asset.headers['Content-Length'] = buffer.length;
        }

        return asset;
    },

    combine: function(file){
        for (var key in this.combinePaths) {
            var files = this.combinePaths[key];
            if (file == null || (file && files.includes(file))) {
                console.log('\nCompressing these ' + files.length + ' files into "' + key + '"\n');
                console.log(files);

                var body = '';
                var hasLess, lesscss;

                files.forEach(function(path){
                    body += '\n' + this.stash[path].string;
                    if (path.includes('.less')) hasLess = true;
                }, this);

                if (hasLess) {
                    lesscss = sqwish.minify(less.renderSync(body));
                }

                this.stash[key] = this.buildAsset(mime.lookup(key), { mtime: new Date() }, body, lesscss);
            }
        }
    },









    add: function(url){
        if (!url.expires || new Date(url.expires) > new Date()) {
            console.log('cache add: ' + url.url);
            this.urls.push(url);
            this.lookup[url.url] = url;
        }
    },

    remove: function(url){
        var u;
        var exists = this.urls.some(function(obj, i){
            if (obj.url == url) u = i;
            return obj.url == url;
        });

        if (exists) {
            console.log('cache remove: ' + url);
            this.urls.splice(u, 1);
            delete this.stash[url];
            delete this.lookup[url];
        }
    },

    reset: function(urls){
        console.log('cache reset to:');
        var oldLookup = utils.cloneObject(this.lookup);
        var oldUrls = utils.cloneArray(this.urls);

        this.urls = urls;
        this.createLookup();

        oldUrls.forEach(function(obj){
            if (!this.lookup[obj.url] && this.stash[obj.url]) {
                console.log('cache remove: ' + obj.url);
                delete this.stash[obj.url];
            }
        }.bind(this));
    },

    empty: function(){
        console.log('cache empty lookup');
        this.urls.forEach(function(obj){
            delete this.stash[obj.url];
        }.bind(this));
        this.urls = [];
        this.createLookup();
    },

    createLookup: function(){
        console.log('cache create lookup:');
        var lookup = {};
        this.urls.forEach(function(url){
            lookup[url.url] = url;
        });
        this.lookup = lookup;
        console.log(this.lookup);
    },

    cache: function(req, res){
        console.log('cache: ' + req.url);
        this.stash[req.url] = res.result;
    },

    uncache: function(url){
        console.log('uncache: ' + url);
        delete this.stash[url];
    },

    isExpired: function(watchedUrl){
        return watchedUrl && watchedUrl.expires && new Date(watchedUrl.expires) < new Date();
    },

    needsCaching: function(req, watchedUrl){
        return req.method == 'GET' && watchedUrl && (!watchedUrl.expires || new Date(watchedUrl.expires) > new Date()) && !this.stash[req.url];
    },

    handle: function(req, res, next){
        var pathname = req.pathname;
        // var asset = this.app.cache.public.files[pathname] ? this.stash[pathname] : this.stash[req.url];
        var watchedUrl = this.lookup[req.url];


        if (req.method != 'GET' || /^\/views|^\/assets/.test(pathname)) {
            next();

        } else if (this.public.files[pathname]) {
            var asset = this.stash[pathname];
            asset ? res.serve(asset) : fs.createReadStream(this.settings.directory + '/public' + pathname).pipe(res);

        } else if (this.stash[req.url]) {
            var asset = this.stash[req.url];

            // this is obviously a watchd url or else it wouldn't be in the stash
            if (this.isExpired(watchedUrl)) {
                this.remove(req.url);
            }

            res.serve(asset);

        } else if (this.public.directories[pathname]) {
            res.sendStatus(403);

        } else {
            if (this.needsCaching(req, watchedUrl)) {
                req.on('end', this.cache.bind(this, req, res));
            }

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
    return new Cache(app);
}
