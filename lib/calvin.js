

'use strict';


const fs = require('fs');
const http = require('http');
const qs = require('qs');
const parseurl = require('parseurl');
const utils = require('./utils');
const coreMiddleware = fs.readdirSync(__dirname + '/middleware/').map(ware => ware.replace('.js', ''));


require('./request');
require('./response');


const Calvin = function(settings) {
    this.stack = [];
    this.locals = {};
    this.engines = {};
    this.stash = {};
    this.settings = this.configure(settings);
    this.settings.middleware.forEach(ware => this.use(ware), this);
}


Calvin.prototype = {

    configure: function(settings) {
        let env = process.env.NODE_ENV;
        let defaults = {
            name: 'App',
            environment: env || 'production',
            directory: '',
            json: {
                spaces: env != 'production' ? 4 : null,
                replacer: null
            },
            errorHandle: false,
            middleware: [],
            cache: {
                views: [],
                engine: 'beard',
                public: false,
                statics: [],
                assets: [],
                combine: {},
                watch: env != 'production',
                minify: env == 'production',
                urls: []
            },
            parser: {
                extended: true
            },
            redirect: {},
            session: {
                cookie: '____calvin',
                secret: 'dontusethis',
                csrf: false
            },
            vhost: {}
        };
        return utils.mergeObjects(defaults, settings);
    },

    load: function(ware) {
        this[ware] = require('./middleware/' + ware)(this);
        return this[ware];
    },

    use: function() {
        let layer;
        let args = Array.from(arguments);

        if (args.length == 2) {
            // captures (route, middleware)
            layer = buildLayer('all', args.shift(), getHandle(args));

        } else if (args.length >= 3) {
            // captures (method, route, middleware)
            layer = buildLayer(args.shift(), args.shift(), getHandle(args));

        } else {
            // captures (middleware || name-of-core-middleware)
            let handle = typeof args[0] == 'string' ? this.load(args[0]) : args[0];
            layer = buildLayer('all', '*', handle);
        }

        this.stack.push(layer);
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
        const done = function(){
            res.sendStatus(404);
        }

        let next = function() {
            let layer = stack[s++];

            if (!layer) {
                defer(done);
                return;
            }

            let wrongMethod = layer.method != 'all' && method != layer.method;
            let wrongSubApp = layer.subapp && pathname.toLowerCase().substr(0, layer.route.length) != layer.route.toLowerCase();
            if (wrongMethod || wrongSubApp) {
                console.log('skip: ' + layer.route);
                next();
                return;
            }

            if (layer.subapp || layer.route == '*') {
                layer.handle(req, res, next);
                return;
            }

            if (pathname != '/' && /\/$/.test(pathname)) {
                // redirects to pathname without trailing slash
                res.status('301').redirect(req.url.replace(/\/([^/]*)$/, '$1'));
                return;
            }

            // this is where the routing happens
            var matches = pathname.match(layer.regex);
            if (matches) {
                matches.shift();
                var found = layer.params.every(function(param, p){
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
                    let preHandle = function(p){
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
    this[method] = function(){
        if (method === 'get' && arguments.length === 1) {
            // return eval('this.settings.' + arguments[0]);
            return;
        }
        let args = Array.from(arguments);
        args.unshift(method);
        return this.use.apply(this, args);
    }
}, Calvin.prototype);


const getHandle = function(args){
    let handle = args.length > 1 ? args : args[0];
    return handle.handle ? handle : args;
}

const buildLayer = function(method, route, handle){
    // I need to test/hook up more complex regexes on use method
    let regex = new RegExp('^/' + route.replace(/:([^\/]+)/g, '([^/]*)').replace('/', '') + '$');
    return {
        subapp: handle.stack,
        // subapp: handle.stack && handle.handle,
        // subapp: typeof handle.handle == 'function',
        method: method,
        route: route,
        regex: regex,
        params: utils.getParamKeys(route, regex),
        handle: wrapMiddlware(handle)
    };
}

const wrapMiddlware = function(layer){
    return layer.handle ? function(req, res, next) {
        layer.handle(req, res, next);
    } : layer;
}

const defer = typeof setImmediate === 'function'
    ? setImmediate
    : function(fn){ process.nextTick(fn.bind.apply(fn, arguments)) }

Error.stackTraceLimit = Infinity;


module.exports = function(settings) {
    return new Calvin(settings);
}
