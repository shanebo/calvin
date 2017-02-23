

'use strict';


const fs = require('fs');
const http = require('http');
const qs = require('qs');
const parseurl = require('parseurl');
const Beard = require('beard');
const utils = require('./utils');
const path = require('path');
const join = path.join;
const resolve = path.resolve;
const Memcache = require('./memcache');
const View = require('./view');


require('./request');
require('./response');


const Calvin = function(opts) {
    this.stack = [];
    this.locals = {};
    this.params = {};
    this.middleware = {};
    this.opts = utils.merge(this.defaults(), opts);
    this.memcache = Memcache(this.opts, this);
    this.opts.middleware.forEach(ware => this.use(ware));
    this.view = View(this.opts, this);
}


Calvin.prototype = {

    defaults: function(opts) {
        let env = process.env.NODE_ENV;
        return {
            name: 'calvin app',
            env: env || 'production',
            middleware: [],
            engine: 'beard',
            views: resolve('views'),
            minify: env === 'production',
            watch: env !== 'production',
            errorHandle: false,
            json: {
                spaces: env !== 'production' ? 4 : null,
                replacer: null
            }
        };
    },

    set: function(key, value) {
        this.opts[key] = value;
        return this;
    },

    load: function(ware) {
        this.middleware[ware] = require('./middleware/' + ware)(this.opts[ware], this);
        return this.middleware[ware];
    },

    use: function() {
        let layer;
        let args = Array.from(arguments);

        if (args.length == 2) {
            // captures (route, middleware)
            layer = buildLayer('all', args.shift(), getHandle(args), this);

        } else if (args.length >= 3) {
            // captures (method, route, middleware)
            layer = buildLayer(args.shift(), args.shift(), getHandle(args), this);

        } else {
            // captures (middleware || name-of-core-middleware)
            let handle = typeof args[0] == 'string' ? this.load(args[0]) : args[0];
            layer = buildLayer('all', '*', handle, this);
        }

        this.stack.push(layer);
        return this;
    },

    param: function(name, handle) {
        this.params[name] = handle;
        return this;
    },

    createServer: function() {
        this.server = http.createServer(this.handle.bind(this));
        return this.server;
    },

    listen: function() {
        if (!this.server) this.createServer();
        return this.server.listen.apply(this.server, arguments);
    },

    handle: function(req, res) {
        req.app = this;
        req.params = {};
        req.body = {};
        req.response = res;
        req.query = utils.parseObject(qs.parse(parseurl(req).query));
        res.app = this;
        res.locals = {};
        res.request = req;
        res.on('error', res.error);

        let s = 0;
        let stack = this.stack;
        let pathname = req.pathname;
        let method = req.method.toLowerCase();
        function done() {
            res.sendStatus(404);
        }

        function next() {
            let layer = stack[s++];

            if (!layer) {
                defer(done);
                return;
            }

            let wrongMethod = layer.method !== 'all' && method !== layer.method;
            let wrongSubApp = layer.subapp && pathname.toLowerCase().substr(0, layer.route.length) !== layer.route.toLowerCase();
            if (wrongMethod || wrongSubApp) {
                // skip: layer.route
                next();
                return;
            }

            if (layer.subapp || layer.route === '*') {
                layer.handle(req, res, next);
                return;
            }

            if (pathname !== '/' && /\/$/.test(pathname)) {
                // redirects to pathname without trailing slash
                res.status('301').redirect(req.url.replace(/\/([^/]*)$/, '$1'));
                return;
            }

            // this is where the routing happens
            var matches = pathname.match(layer.regex);
            if (matches) {
                matches.shift();
                var found = layer.params.every(function(param, p) {
                    var splat = param.split('(');
                    var name = splat[0];
                    var regex = splat[1] ? new RegExp(splat[1].replace(/\)$/, '')) : false;
                    if (regex && !regex.test(matches[p])) {
                        return false;
                    }
                    req.params[name] = matches[p];
                    return true;
                });

                if (found) {
                    let handle = layer.handle;
                    function preHandle(p) {
                        let n = p + 1;
                        let subLayer = handle[n];
                        let subHandle = wrapMiddlware(subLayer);
                        return n === handle.length - 1
                            ? subHandle.bind(subLayer, req, res)
                            : subHandle.bind(subLayer, req, res, preHandle(n));
                    }
                    preHandle(-1)();
                    return;
                }
            }

            next();
        }

        try {
            next();
        } catch (e) {
            res.error(e, 500);
        }
    }
};


// add a 'route' method that denotes 'all'
// add an 'all' method that denotes 'all'
utils.methods.forEach(function(method) {
    this[method] = function() {
        if (method === 'get' && arguments.length === 1) {
            return this.opts[arguments[0]];
        }

        // concept code for cached callbacks throughout stack
        // cacheCheckCallback = function() {
        //     cacheAvailable ? cachedCallback() : callback();
        // }
        // this.use.apply(this, cacheCheckCallback);
        let args = Array.from(arguments);
        args.unshift(method);
        let callbacks = args;
        return this.use.apply(this, callbacks);
    }
}, Calvin.prototype);


function getHandle(args) {
    let handle = args.length > 1 ? args : args[0];
    return handle.handle ? handle : args;
}

function buildLayer(method, route, handle, app) {
    // I need to test/hook up more complex regexes on use method
    let regex = new RegExp('^/' + route.replace(/:([^\/:.-]+)/g, '([^/]*)').replace('/', '') + '$');
    let params = utils.getParamKeys(route, regex);
    params.forEach(function(match) {
        let param = match.split('(')[0];
        if (app.params[param]) {
            handle.unshift(app.params[param]);
        }
    });

    return {
        subapp: handle.stack,
        method: method,
        route: route,
        regex: regex,
        params: params,
        handle: wrapMiddlware(handle)
    };
}

function wrapMiddlware(layer){
    return layer.handle
        ? function(req, res, next) { layer.handle(req, res, next); }
        : layer;
}

const defer = typeof setImmediate === 'function'
    ? setImmediate
    : function(fn){ process.nextTick(fn.bind.apply(fn, arguments)) };

Error.stackTraceLimit = Infinity;


module.exports = function(opts) {
    return new Calvin(opts);
}
