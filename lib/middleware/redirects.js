

var Redirects = function(app){
    console.log('Initializing Redirects middleware...');
    this.lookup = app.settings.redirects;
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

        if (this.lookup[url]) {
            response.redirect(this.lookup[url], 301);

        } else if (this.lookup[hostname + url]) {
            response.redirect(this.lookup[hostname + url], 301);

        } else if (this.lookup[host + url]) {
            response.redirect(this.lookup[host + url], 301);

        } else if (this.lookup[hostname]) {
            response.redirect(this.lookup[hostname] + url, 301);

        } else if (this.lookup[host]) {
            response.redirect(this.lookup[host] + url, 301);

        } else {
            next();
        }
    }
};


module.exports = function(app){
    return new Redirects(app);
}
