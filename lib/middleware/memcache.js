

var Memcache = function(app){
    console.log('Initializing Memcache middleware...');
    this.app = app;
    this.settings = app.settings;
    this.urls = Array.clone(this.settings.memcache.urls);
    this.urlsToRegex();
}


Memcache.prototype = {

    add: function(url){
        this.settings.memcache.urls.push(url);
        this.urlsToRegex();
    },

    remove: function(url){
        var u = this.settings.memcache.urls.indexOf(url);
        if (u > -1) {
            this.settings.memcache.urls.splice(u, 1);
        }
        this.urlsToRegex();
    },

    urlsToRegex: function(){
        var urls = this.settings.memcache.urls.map(function(url){
            return url.replace('?', '\\?');
        });
        this.regex = new RegExp('^' + urls.join('$|^') + '$');
    },

    empty: function(){
        this.settings.memcache.urls.forEach(function(url){
            delete this.app.cache[url];
        }.bind(this));
        this.settings.memcache.urls = Array.clone(this.urls);
        this.urlsToRegex();
    },

    needsCaching: function(request){
        return request.method == 'GET' && this.regex.test(request.url) && !this.app.cache[request.url];
    },

    cache: function(request, response){
        this.app.cache[request.url] = response.result;
    },

    handler: function(request, response, next){
        var asset = this.app.cache[request.url];

        if (asset && request.method === 'GET' && !request.url.test(/^\/views|^\/assets/)) {
            request.calvin.asset = 'memcached';
            response.serve(asset);
        } else {
            next();
        }

        if (this.needsCaching(request)) {
            request.on('end', this.cache.bind(this, request, response));
        }
    }
};


module.exports = function(app){
    return new Memcache(app);
}
