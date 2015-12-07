

require('mootools');


var http = require('http');
var res = require('./response');
var req = require('./request');


var Calvin = function(options){
    for (var prop in options) this.options[prop] = options[prop];
    console.log('\nInitializing ' + this.options.name + ' app');
    this.options.middleware.forEach(this.use, this);
}


Calvin.prototype = {

    stack: [],

    options: {
        name: 'Calvin',
        environment: process.env.NODE_ENV || 'production',
        engine: 'beard',
        directory: '',
        middleware: ['logger', 'assets', 'router'],
        memcache: {
            urls: []
        },
        assets: {
            paths: [],
            press: {}
        },
        cache: {},
        publics: false
    },

    get: function(){
        this.router.get.apply(this.router, arguments);
    },

    post: function(){
        this.router.post.apply(this.router, arguments);
    },

    put: function(){
        this.router.put.apply(this.router, arguments);
    },

    delete: function(){
        this.router.delete.apply(this.router, arguments);
    },

    loadMore: function(ware){
        var middleware = require('./middleware/' + ware)(this.options);
        if (['assets', 'router'].contains(ware)) this[ware] = middleware;
        return middleware;
    },

    use: function(ware){
        ware = (typeof ware === 'string') ? this.loadMore(ware) : { handler: ware };
        this.stack.push(ware);
        return this;
    },

    createServer: function(){
        if (arguments.length) this.stack = Array.from(arguments);
        this.server = http.createServer(this.handler.bind(this));
        return this.server;
    },

    listen: function(port){
        if (this.server) this.server.listen(port)
        else this.createServer().listen(port);
    },

    handler: function(request, response){
        req.extend(request, response, this);
        res.extend(request, response, this);

        var stack = this.stack;
        var next = function(s){
            var ware = stack[s + 1];
            return ware ? ware.handler.bind(ware, request, response, next(s + 1)) : function(){};
        }

        try {
            next(-1)();
        } catch(err) {
            response.error(err, err.message);
        }
    }
};


module.exports = function(options){
    return new Calvin(options);
}
