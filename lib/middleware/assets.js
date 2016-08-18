

'use strict';

const fs = require('fs');
const mime = require('mime');
const uglifyjs = require('uglify-js');
const sqwish = require('sqwish');
const zlib = require('zlib');
const less = require('less');
const utils = require('../utils');


const Assets = function(app){
    this.app = app;
    this.settings = app.settings;
    this.public = {
        files: {},
        directories: {}
    };

    for (var route in this.settings.assets.press) {
        this.public.files[route] = true;
    }

    this.walk('/views/');
    this.walk('/assets/');
    this.walk('/public/', 'both');

    // console.log(this.public);

    // if (this.settings.views.path) {
    //     this.settings.assets.paths.push(this.settings.views.path);
    // } else if (utils.exists(this.settings.directory + '/views/')) {
    //     this.settings.assets.paths.push('/views/');
    // }

    // this.defaults();
    // this.settings.assets.paths.forEach(this.cache, this);
    // this.getPublicPaths('/public/');
    this.press();
}


Assets.prototype = {

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

    // getPublicPaths: function(dir){
    //     this.walkPublic(dir);
    //     for (var route in this.settings.assets.press) {
    //         this.public.files[route] = true;
    //     }
    //     return this.public;
    // },

    // defaults: function(){
    //     this.store(__dirname + '/../public/status.html', '/views/calvin/status.html');
    //     this.store(__dirname + '/../public/trace.html', '/views/calvin/trace.html');
    //     this.store(__dirname + '/../public/errors.css', '/calvin/errors.css');
    //     this.store(__dirname + '/../public/favicon.ico', '/favicon.ico');
    // },



    store: function(path, key){
        var type = mime.lookup(path);
        var body = this.getBody(path, type);
        var stats = fs.statSync(path);

        this.app.cache[key] = this.buildAsset(type, stats, body, path.includes('.less') ? body : null);

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

    getBody: function(path, type){
        var body = fs.readFileSync(path, 'utf8');
        var minify = this.settings.assets.minify;
        console.log('minify: ' + minify);
        // if (path.includes('.less')) type = 'text/less';

        switch (type) {
            case 'text/css':                    return minify ? sqwish.minify(body) : body;
            case 'text/less':                   return body;
            case 'application/javascript':      return minify ? uglifyjs.minify(body, {fromString: true}).code : body;
            // case 'text/html':                   return minify ? body : body.clean();
            case 'text/html':                   return minify ? utils.removeExtraHtmlWhitespace(body) : body;
            // add a case for btml?
            default:                            return fs.readFileSync(path);
        }

        // switch (type) {
        //     case 'text/css':                    return minify ? body : sqwish.minify(body);
        //     case 'text/less':                   return body;
        //     case 'application/javascript':      return minify ? body : uglifyjs.minify(body, {fromString: true}).code;
        //     // case 'text/html':                   return minify ? body : body;
        //     // case 'text/html':                   return minify ? body : body.clean();
        //     case 'text/html':                   return minify ? body : utils.removeExtraHtmlWhitespace(body);
        //     default:                            return fs.readFileSync(path);
        // }
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

    press: function(file){
        for (var key in this.settings.assets.press) {
            var files = this.settings.assets.press[key];
            if (file == null || (file && files.includes(file))) {
                console.log('\nCompressing these ' + files.length + ' files into "' + key + '"\n');
                console.log(files);

                var body = '';
                var hasLess, lesscss;

                files.forEach(function(path, f){
                    body += '\n' + this.app.cache[path].string;
                    if (path.includes('.less')) hasLess = true;
                }, this);

                if (hasLess) {
                    lesscss = sqwish.minify(less.renderSync(body));
                }

                this.app.cache[key] = this.buildAsset(mime.lookup(key), { mtime: new Date() }, body, lesscss);
            }
        }
    },

    handle: function(req, res, next){
        var pathname = req.pathname;

        if (req.method != 'GET' || /^\/views|^\/assets/.test(pathname)) {
            next();
            return;

        } else if (this.public.files[pathname]) {
            var asset = this.app.cache[pathname];
            asset ? res.serve(asset) : fs.createReadStream(this.settings.directory + '/public' + pathname).pipe(res);
            return;

        } else if (this.public.directories[pathname]) {
            res.sendStatus(403);
            return;
        }

        next();
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
