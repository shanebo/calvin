

'use strict';


Error.stackTraceLimit = Infinity;


const http = require('http');
const merge = require('utils-merge');
const utils = require('./utils');
const methods = utils.methods;
const stockMiddleware = ['assets', 'parser', 'redirects'];


require('./request');
require('./response');


const Calvin = function(settings) {
    var defaults = {
        name: 'Calvin App',
        environment: process.env.NODE_ENV || 'production',
        engine: 'beard',
        directory: '',
        middleware: [],
        views: {
            path: false
        },
        // middleware settings
        assets: {
            minify: process.env.NODE_ENV == 'production',
            watch: process.env.NODE_ENV != 'production',
            paths: [],
            press: {}
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

    this.settings = merge(defaults, settings);

    this.stack = [];
    this.locals = {};
    this.engines = {};
    this.cache = {};

    console.log(this.settings);

    // this.redirects = require('./middleware/redirects');
    // ['assets'].forEach(this.load.bind(this));

    this.settings.middleware.forEach(this.use, this);

//  this.defaultConfiguration();
};


Calvin.prototype = {

    load: function(ware) {
        this[ware] = require('./middleware/' + ware)(this);
        return this[ware];
    },

    use: function() {
        let method, route, handle, subapp;
        let args = Array.from(arguments);

        if (stockMiddleware.includes(args[0])) {
            // captures (name of stock middleware)
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
            console.log('captures (middleware)');
            // captures (middleware)
            method = 'all';
            route = '*';
            handle = args[0];
        }


        // if (typeof args[0] == 'string' && typeof args[1] == 'string') {
        //     // captures (method, route, middleware)
        //     method = args.shift();
        //     route = args.shift();
        //     handle = getHandle(args);
        //
        // } else if (typeof args[0] == 'string') {
        //     // captures (route, middleware)
        //     method = 'all';
        //     route = args.shift();
        //     handle = getHandle(args);
        //
        // } else {
        //     console.log('captures (middleware)');
        //     // captures (middleware)
        //     method = 'all';
        //     route = '*';
        //     handle = args[0];
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

        console.log('\n');
        console.log('\n');
        console.log(ware);

        this.stack.push(ware);
        return this;
    },

    // for vhost situations
    createServer: function() {
        this.server = http.createServer(this.handle.bind(this));
        return this.server;
    },

    listen: function() {
        if (!this.server) this.createServer();
        return this.server.listen.apply(this.server, arguments);
    },

    // listen: function() {
    //     let server = http.createServer(this.handle.bind(this));
    //     return server.listen.apply(server, arguments);
    // },

    handle: function(req, res) {
        if (req.pathname != '/' && /\/$/.test(req.pathname)) {
            // redirects to pathname without trailing slash
            res.status('301').redirect(req.url.replace(/\/([^/]*)$/, '$1'));
            return;
        }

        req.response = res;
        res.request = req;
        req.app = this;
        res.app = this;
        // res.on('error', res.error);

        let s = 0;
        let stack = this.stack;
        let pathname = req.pathname;
        let method = req.method.toLowerCase();

        var done = function(){
            console.log('last layer in calvin didnt find this route');
            res.sendStatus(404);
        }

        let next = function() {
            let layer = stack[s++];

            if (!layer) {
                done();
                return;
            }

            let isWrongMethod = layer.method != 'all' && method != layer.method;
            let isWrongSubApp = layer.subapp && pathname.toLowerCase().substr(0, layer.route.length) != layer.route.toLowerCase();
            if (isWrongMethod || isWrongSubApp) {
                // console.log('skipping ' + layer.route + ' app');
                next();
                return;
            }

            if (layer.subapp || layer.route == '*') {
                layer.handle(req, res, next);
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
                    let preHandle = function(h){
                        let hand = handle[h + 1];

                        if (h + 1 === handle.length - 1) {
                            console.log('LAST HAND!!!');
                            return hand ? hand.bind(hand, req, res) : function(){ console.log('last hand'); };
                        } else {
                            console.log('MORE HANDS LEFT!!!');
                            return hand ? hand.bind(hand, req, res, preHandle(h + 1)) : function(){ console.log('before last hand'); };
                        }

                        // if (hand) {
                        //     if (h + 1 === handle.length - 1) {
                        //         console.log('LAST HAND!!!');
                        //         return hand.bind(hand, req, res);
                        //     } else {
                        //         console.log('MORE HANDS LEFT!!!');
                        //         return hand.bind(hand, req, res, preHandle());
                        //     }
                        //
                        //     // if (h + 1 === handle.length - 1) {
                        //     //     hand.call(hand, req, res);
                        //     // } else {
                        //     //     hand.call(hand, req, res, preHandle);
                        //     // }
                        //     // hand.call(hand, req, res, preHandle);
                        // } else {
                        //     next();
                        // }
                    }
                    preHandle(-1)();
                    // preHandle();
                    return;
                }

                // if (found) {
                //     let h = 0;
                //     let handle = layer.handle;
                //     let preHandle = function(){
                //         let hand = handle[h++];
                //
                //         if (h + 1 === handle.length - 1) {
                //             console.log('LAST HAND!!!');
                //             return hand ? hand.bind(hand, req, res) : function(){ console.log('last hand'); };
                //         } else {
                //             console.log('MORE HANDS LEFT!!!');
                //             return hand ? hand.bind(hand, req, res, preHandle()) : console.log('before last hand');
                //         }
                //
                //         // if (hand) {
                //         //     if (h + 1 === handle.length - 1) {
                //         //         console.log('LAST HAND!!!');
                //         //         return hand.bind(hand, req, res);
                //         //     } else {
                //         //         console.log('MORE HANDS LEFT!!!');
                //         //         return hand.bind(hand, req, res, preHandle());
                //         //     }
                //         //
                //         //     // if (h + 1 === handle.length - 1) {
                //         //     //     hand.call(hand, req, res);
                //         //     // } else {
                //         //     //     hand.call(hand, req, res, preHandle);
                //         //     // }
                //         //     // hand.call(hand, req, res, preHandle);
                //         // } else {
                //         //     next();
                //         // }
                //     }
                //     preHandle()();
                //     // preHandle();
                //     return;
                // }
            }

            next();
        }

        try {
            next();
        } catch (e) {
            res.error(e, 500);
            // res.error(e, e.message);
        }
    }
};


// add a 'route' method that denotes 'all'
// add an 'all' method that denotes 'all'
methods.forEach(function(method){
    this[method] = function(){
        // if (method === 'get' && arguments.length === 1) {
        //     // app.get(setting)
        //     console.log('call app set method here');
        //     return;
        //     // return this.set(path);
        // }
        let args = Array.from(arguments);
        args.unshift(method);
        return this.use.apply(this, args);
    };
}, Calvin.prototype);

const getHandle = function(args){
    let handle = args.length > 1 ? args : args[0];
    return handle.handle ? handle : args;
}

const defer = typeof setImmediate === 'function'
    ? setImmediate
    : function(fn){ process.nextTick(fn.bind.apply(fn, arguments)) }


module.exports = function(settings) {
    return new Calvin(settings);
}
