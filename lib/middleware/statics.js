

'use strict';


const fs = require('fs');
const mime = require('mime');
const less = require('less');
const path = require('path');
const join = path.join;
const resolve = path.resolve;
const extname = path.extname;
const utils = require('../utils');


const Statics = function(opts, app) {
    this.app = app;
    this.opts = utils.merge(this.defaults(), opts);

    app.memcache.in('public').store(__dirname + '/../public/errors.css', '/calvin/errors.css');
    app.memcache.in('public').store(__dirname + '/../public/favicon.ico', '/favicon.ico');

    ['assets', 'public'].forEach(function(dir) {
        if (utils.exists(this.opts.dirs[dir])) {
            this.load[dir].call(this);
            app.memcache.watch(this.opts.dirs[dir], this.load[dir].bind(this));
        }
    }.bind(this));
}


Statics.prototype = {

    defaults: function() {
        return {
            public: ['/'],
            assets: {},
            dirs: {
                assets: resolve('assets'),
                public: resolve('public')
            }
        };
    },

    load: {
        assets: function() {
            for (var key in this.opts.assets) {
                let files = this.opts.assets[key];
                console.log('\nCompressing these ' + files.length + ' files into "' + key + '"\n');
                console.log(files);
                let type = mime.lookup(key);
                let body = files.map(f => fs.readFileSync(join(this.opts.dirs.assets, f), 'utf8')).join('\n');
                if (type === 'text/css') body = less.renderSync(body);

                this.app.memcache.in('public').cacheAsset(key, type, body);
            }
        },
        public: function() {
            this.publicLookup();
            let pubFiles = this.getPaths();
            this.app.memcache.in('public').cache(pubFiles);
        }
    },

    publicLookup: function() {
        let obj = {};
        obj.directories = {};
        obj.files = {};
        let arr = utils.toPathArray(this.opts.dirs.public);
        for (var pathname in this.opts.assets) arr.push(pathname);
        arr.push('/favicon.ico');
        arr.push('/calvin/errors.css');
        arr.push('/calvin/errors.css');
        arr.forEach(function(p){
            let key = p.replace(this.app.memcache.regex, '');
            if (extname(p) === '') {
                obj.directories[key] = true;
            } else {
                obj.files[key] = true;
            }
        }.bind(this));
        this.public = obj;
    },

    getPaths: function() {
        let publicPaths = utils.toPathArray(this.opts.dirs.public);
        let neededPaths = utils.toFlatArray(this.opts.public).map(p => this.opts.dirs.public + p);
        let neededRegex = utils.arrayToRegex(neededPaths);
        let neededArr = publicPaths.filter(p => p.match(neededRegex));
        return utils.toFlatArray(neededArr).filter(p => extname(p) !== '');
    },

    serve: function(req, res, asset) {
        let etag = req.headers['if-none-match'];

        if (etag && etag == asset.headers['ETag']) {
            res.writeHead(304, asset.headers);
            res.end();
            return;
        }

        asset.headers['Date'] = new Date().toUTCString();
        res.writeHead(200, asset.headers);
        res.end(asset.body);
    },

    handle: function(req, res, next) {
        let pathname = req.pathname;

        if (req.method != 'GET') {
            next();

        } else if (this.public.files[pathname]) {
            let asset = this.app.cache.public[pathname];
            if (asset) {
                res.locals.isCached = true;
                this.serve(req, res, asset);
            } else {
                fs.createReadStream(join(this.opts.dirs.public, pathname)).pipe(res);
            }

        } else if (this.public.directories[pathname]) {
            res.sendStatus(403);

        } else {
            next();
        }
    }
};


less.renderSync = function(input) {
    let css;
    this.render(input, { sync: true }, function(err, result) {
        if (err) throw err;
        css = result.css;
    });
    return css;
}


module.exports = function(opts, app) {
    return new Statics(opts, app);
}
