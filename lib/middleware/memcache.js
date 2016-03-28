

var Memcache = function(app){
    console.log('Initializing Memcache middleware...');
    this.app = app;
    this.urls = app.settings.memcache;
    this.createLookup();
}


Memcache.prototype = {

    add: function(url){
        if (!url.expires || new Date(url.expires) > new Date()) {
            console.log('memcache add: ' + url.url);
            this.urls.push(url);
            this.lookup[url.url] = url;
        }
    },

    remove: function(url){
        var u;
        var exists = this.urls.some(function(obj, i){
            if (obj.url == url) u = i;
            return obj.url == url;
        });

        if (exists) {
            console.log('memcache remove: ' + url.url);
            this.urls.splice(u, 1);
            delete this.app.cache[url];
            delete this.lookup[url.url];
        }
    },

    reset: function(urls){
        console.log('memcache reset to:');

        var oldLookup = Object.clone(this.lookup);
        var oldUrls = Array.clone(this.urls);

        this.urls = urls;
        this.createLookup();

        oldUrls.forEach(function(obj){
            if (!this.lookup[obj.url] && this.app.cache[obj.url]) {
                console.log('memcache remove: ' + obj.url);
                delete this.app.cache[obj.url];
            }
        }.bind(this));
    },

    empty: function(){
        console.log('memcache empty lookup');
        this.urls.forEach(function(obj){
            delete this.app.cache[obj.url];
        }.bind(this));
        this.urls = [];
        this.createLookup();
    },

    createLookup: function(){
        console.log('memcache create lookup:');
        var lookup = {};
        this.urls.forEach(function(url){
            lookup[url.url] = url;
        });
        this.lookup = lookup;
        console.log(this.lookup);
    },

    cache: function(request, response){
        console.log('memcache cache: ' + request.url);
        this.app.cache[request.url] = response.result;
    },

    needsCaching: function(request, cacheUrl){
        return request.method == 'GET' && cacheUrl && (!cacheUrl.expires || new Date(cacheUrl.expires) > new Date()) && !this.app.cache[request.url];
    },

    handler: function(request, response, next){
        var cacheUrl = this.lookup[request.url];
        if (cacheUrl && cacheUrl.expires && new Date(cacheUrl.expires) < new Date()) {
            console.log('memcache remove: ' + request.url);
            this.remove(request.url);
        }

        var asset = this.app.assets.public.files[request.pathname] ? this.app.cache[request.pathname] : this.app.cache[request.url];

        if (asset && request.method === 'GET' && !request.url.test(/^\/views|^\/assets/)) {
            request.calvin.asset = 'memcached';
            response.serve(asset);
        } else {
            if (this.needsCaching(request, cacheUrl)) {
                request.on('end', this.cache.bind(this, request, response));
            }
            next();
        }
    }
};


module.exports = function(app){
    return new Memcache(app);
}
