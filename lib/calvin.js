

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
    this.settings.middleware.forEach(this.use, this);
}


Calvin.prototype = {

    configure: function(settings) {
        var defaults = {
            name: 'App',
            environment: process.env.NODE_ENV || 'production',
            directory: '',
            middleware: [],
            cache: {
                views: [],
                engine: 'beard',
                public: false,
                statics: [],
                assets: [],
                combine: {},
                watch: process.env.NODE_ENV != 'production',
                minify: process.env.NODE_ENV == 'production',
                urls: []
            },
            parser: {
                extended: true
            },
            redirects: {},
            sessions: {
                cookie: '____calvin',
                secret: 'dontusethis',
                csrf: false
            },
            vhosts: {}
        };
        return utils.mergeObjects(defaults, settings);
    },

    load: function(ware) {
        this[ware] = require('./middleware/' + ware)(this);
        return this[ware];
    },

    build: function(handle, route) {

    },

    use: function() {
        let method, route, handle, subapp;
        let args = Array.from(arguments);

        if (coreMiddleware.includes(args[0])) {
            // captures (name of stock middleware)
            console.log(args[0]);
            method = 'all';
            route = '*';
            // run some sort of getHandle wrap method
            handle = this.load(args[0]);

        } else if (typeof args[0] == 'string' && typeof args[1] == 'string') {
            // captures (method, route, middleware)
            method = args.shift();
            route = args.shift();
            // run some sort of getHandle wrap method
            handle = getHandle(args);

        } else if (typeof args[0] == 'string') {
            // captures (route, middleware)
            method = 'all';
            route = args.shift();
            // run some sort of getHandle wrap method
            handle = getHandle(args);

        } else {
            // captures (middleware)
            method = 'all';
            route = '*';
            // run some sort of getHandle wrap method
            handle = args[0];
        }

        //  todo
        //  - map when handle is an array and wrap subapps and bind the handle to the subapp for when using a subapp in a route prehandle
        // wrap sub-apps
        // if ('function' == typeof fn.handle) {
        //     var server = fn;
        //     fn.route = route;
        //     fn = function(req, res, next){
        //         server.handle(req, res, next);
        //     };
        // }
        if (handle.handle) {
            // wrap subapp or middleare
            if (handle.stack) subapp = true;
            var server = handle;
            // server.route = route;
            handle = function (req, res, next) {
                server.handle(req, res, next);
            }
        }

        let regex = new RegExp('^/' + route.replace(/:([^\/]+)/g, '([^/]*)').replace('/', '') + '$');
        let ware = {
            subapp: subapp,
            method: method,
            route: route,
            regex: regex,
            params: utils.getParamKeys(route, regex),
            handle: handle
        };

        this.stack.push(ware);
        return this;
    },

/*
    use: function() {
        let method, route, handle, subapp;
        let args = Array.from(arguments);

        if (coreMiddleware.includes(args[0])) {
            // captures (name of stock middleware)
            console.log(args[0]);
            method = 'all';
            route = '*';
            handle = this.load(args[0]);

        } else if (typeof args[0] == 'string' && typeof args[1] == 'string') {
            // captures (method, route, middleware)
            method = args.shift();
            route = args.shift();
            handle = getHandle(args);

        } else if (typeof args[0] == 'string') {
            // captures (route, middleware)
            method = 'all';
            route = args.shift();
            handle = getHandle(args);

        } else {
            // captures (middleware)
            method = 'all';
            route = '*';
            handle = args[0];
        }

        //  todo
        //  - map when handle is an array and wrap subapps and bind the handle to the subapp for when using a subapp in a route prehandle
        // wrap sub-apps
        // if ('function' == typeof fn.handle) {
        //     var server = fn;
        //     fn.route = route;
        //     fn = function(req, res, next){
        //         server.handle(req, res, next);
        //     };
        // }
        if (handle.handle) {
            // wrap subapp or middleare
            if (handle.stack) subapp = true;
            var server = handle;
            server.route = route;
            handle = function (req, res, next) {
                server.handle(req, res, next);
            }
        }

        let regex = new RegExp('^/' + route.replace(/:([^\/]+)/g, '([^/]*)').replace('/', '') + '$');
        let ware = {
            subapp: subapp,
            method: method,
            route: route,
            regex: regex,
            params: utils.getParamKeys(route, regex),
            handle: handle
        };

        this.stack.push(ware);
        return this;
    },
*/

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

                // if (found) {
                //     let handle = layer.handle;
                //     let preHandle = function(p){
                //         let n = p + 1;
                //         let hand = handle[n];
                //         return n === handle.length - 1
                //             ? hand.bind(hand, req, res)
                //             : hand.bind(hand, req, res, preHandle(n));
                //     }
                //     preHandle(-1)();
                //     return;
                // }
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
            // make this more robust to dig deeper into settings. perhaps use drill
            return this.settings[arguments[0]];
        }
        let args = Array.from(arguments);
        args.unshift(method);
        return this.use.apply(this, args);
    }
}, Calvin.prototype);

const wrapMiddlware = function(layer){
    return layer.handle ? function(req, res, next) {
        layer.handle(req, res, next);
    } : layer;
}

const getHandle = function(args){
    let handle = args.length > 1 ? args : args[0];
    return handle.handle ? handle : args;
}

const defer = typeof setImmediate === 'function'
    ? setImmediate
    : function(fn){ process.nextTick(fn.bind.apply(fn, arguments)) }

Error.stackTraceLimit = Infinity;


module.exports = function(settings) {
    return new Calvin(settings);
}
