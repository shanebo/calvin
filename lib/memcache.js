

// Problems to Solve
// 1) Get a directories listing and files listing of public folder
// 2) Cache only the public directories and files passed into the public array
// 3) Cache all the views directories and files passed into the views array
// 4) Combine the assets and store in memory as public routes
// 5) Handle requests for assets, public, and cached views

// Cache all of assets folder if its there
// if it's production kill all assets from cache?
// Cache only the public files that get passed in
// Cache all views
// Watch all views, assets, and cached publics


'use strict';


const fs = require('fs');
const mime = require('mime');
const uglifyjs = require('uglify-js');
const sqwish = require('sqwish');
const zlib = require('zlib');
const clone = require('clone');
const utils = require('./utils');
const path = require('path');
const join = path.join;
const resolve = path.resolve;
const extname = path.extname;


const Memcache = function(opts, app){
    app.cache = {};
    app.cache.views = {};
    app.cache.public = {};
    app.cache.assets = {};
    app.cache.pages = {};

    this.app = app;
    this.opts = opts;
    this.regex = utils.arrayToRegex([
        '\.beard$|\.brd$',
        resolve('assets'),
        resolve('public'),
        resolve('views') + '/'
    ]);
}


function getFiles(dir) {
    let dirs = utils.toFlatArray(dir);
    let files = dirs.map(d => utils.getFiles(d));
    return utils.toFlatArray(files).filter(f => extname(f) !== '');
}

function getBody(path, type, minify) {
    let body = fs.readFileSync(path, 'utf8');
    return bodyTable(type, body, minify) || fs.readFileSync(path);
}

function bodyTable(type, body, minify) {
    switch (type) {
        case 'application/javascript':
            return minify ? uglifyjs.minify(body, { fromString: true }).code : body;
        case 'text/html':
        case 'text/beard':
            return minify ? utils.removeExtraHtmlWhitespace(body) : body;
        case 'text/css':
            return minify ? sqwish.minify(body) : body;
        default:
            return null;
    }
}

function buildAsset(type, stat, body){
    let mtime = stat.mtime.toUTCString();
    let buffer = zlib.gzipSync(body);
    return {
        body: buffer,
        headers: {
            'Cache-Control': 'public',
            'Content-Encoding': 'gzip',
            'Content-Length': buffer.length,
            'Content-Type': type,
            'ETag': `"${mtime}"`,
            'Last-Modified': mtime,
            'Vary': 'Accept-Encoding'
        }
    };
}

mime.define({
    'text/beard': ['beard', 'brd']
});


Memcache.prototype = {

    in: function(table) {
        this._table = table;
        return this;
    },

    get: function(key) {
        return this.app.cache[this._table][key];
    },

    set: function(key, value) {
        key = key.replace(this.regex, '');
        this.app.cache[this._table][key] = value;
        return this;
    },

    cache: function(p) {
        let files = Array.isArray(p) ? p : getFiles(p);
        files.forEach(f => this.store(f));
        this._table = '';
    },

    cacheAsset: function(key, type, str) {
        let stat = { mtime: new Date() };
        let body = bodyTable(type, str, this.opts.minify);
        let asset = buildAsset(type, stat, body);
        this.set(key, asset);
        this._table = '';
    },

    watch: function(dir, callback) {
        if (this.opts.watch) {
            getFiles(dir).forEach(function(p){
                fs.unwatchFile(p);
                fs.watchFile(p, callback);
            });
        }
    },

    store: function(file, key) {
        let asset;
        let type = mime.lookup(file);

        if (type === 'text/beard') {
            asset = getBody(file, type, this.opts.minify);
        } else {
            let body = getBody(file, type, this.opts.minify);
            let stat = fs.statSync(file);
            asset = buildAsset(type, stat, body);
        }

        this.set(key || file, asset);
    }
};


module.exports = function(opts, app){
    return new Memcache(opts, app);
}
