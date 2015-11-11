

var app;


var Memcache = function(settings){
    console.log('Initializing Memcache middleware...');
    app = settings;

    app.memcache.add = this.add.bind(this);
    app.memcache.remove = this.remove.bind(this);
    app.memcache.empty = this.empty.bind(this);

    this.urls = Array.clone(app.memcache.urls);
    this.urlsToRegex();
}


Memcache.prototype = {

    add: function(url){
        app.memcache.urls.push(url);
        this.urlsToRegex();
    },

    remove: function(url){
        var u = app.memcache.urls.indexOf(url);
        if (u > -1) {
            app.memcache.urls.splice(u, 1);
        }
        this.urlsToRegex();
    },

    urlsToRegex: function(){
        var urls = app.memcache.urls.map(function(url){
            return url.replace('?', '\\?');
        });
        console.log(urls);
        app.memcache.regex = new RegExp('^' + urls.join('$|^') + '$');
    },

    empty: function(){
        app.memcache.urls.forEach(function(url){
            delete app.cache[url];
        });
        app.memcache.urls = Array.clone(this.urls);
        this.urlsToRegex();
    },

    handler: function(request, response, next){
        var asset = app.cache[request.url];

        if (asset && request.method === 'GET' && !request.url.test(/^\/views|^\/assets/)) {
            request.calvin.asset = 'memcached';
            response.serve(asset);
        } else {
            next();
        }
    }

};


module.exports = function(options){
    return new Memcache(options);
}
