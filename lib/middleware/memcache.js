

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
        console.log('******** MEMCACHE URLS TO REGEX ********');
        var urls = this.settings.memcache.urls.map(function(url){
            return url.replace('?', '\\?');
        });
        this.settings.memcache.regex = new RegExp('^' + urls.join('$|^') + '$');
    },

    empty: function(){
        console.log('******** EMPTY MEMCACHE ********');
        this.settings.memcache.urls.forEach(function(url){
            delete this.app.cache[url];
        }.bind(this));
        this.settings.memcache.urls = Array.clone(this.urls);
        this.urlsToRegex();
    },

    handler: function(request, response, next){
        response.memcache = {};
        response.memcache.add = this.add.bind(this);
        response.memcache.remove = this.remove.bind(this);
        response.memcache.empty = this.empty.bind(this);
        response.memcache.regex = this.settings.memcache.regex;

        var asset = this.app.cache[request.url];

        if (asset && request.method === 'GET' && !request.url.test(/^\/views|^\/assets/)) {
            request.calvin.asset = 'memcached';
            response.serve(asset);
        } else {
            next();
        }
    }
};


module.exports = function(app){
    return new Memcache(app);
}
