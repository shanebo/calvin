

var Redirects = function(app){
    console.log('Initializing Redirects middleware...');
    this.lookup = app.settings.redirects;
}

var buildUrl = function(url, params){
    return url.contains('?') ? url : url + params;
}

Redirects.prototype = {

    add: function(from, to){
        this.lookup[from] = to;
    },

    remove: function(url){
        delete this.lookup[url];
    },

    reset: function(lookup){
        this.lookup = lookup;
    },

    empty: function(){
        this.lookup = {};
    },

    handler: function(request, response, next){
        var url = request.url;
        var host = request.host;
        var hostname = request.hostname;
        var params = request.search || '';

        if (this.lookup[url]) {
            response.redirect(buildUrl(this.lookup[url], params), 301);

        } else if (this.lookup[hostname + url]) {
            response.redirect(buildUrl(this.lookup[hostname + url], params), 301);

        } else if (this.lookup[host + url]) {
            response.redirect(buildUrl(this.lookup[host + url], params), 301);

        } else if (this.lookup[hostname]) {
            response.redirect(buildUrl(this.lookup[hostname] + url, params), 301);

        } else if (this.lookup[host]) {
            response.redirect(buildUrl(this.lookup[host] + url, params), 301);

        } else {
            next();
        }
    }
};


module.exports = function(app){
    return new Redirects(app);
}
