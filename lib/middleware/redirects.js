

'use strict';


const Redirects = function(app){
    console.log('Initializing Redirects middleware...');
    this.lookup = app.settings.redirects;
}

const buildUrl = function(url, params){
    return url.includes('?') ? url : url + params;
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

    handle: function(req, res, next){
        let url = req.url;
        let host = req.host;
        let hostname = req.hostname;
        let params = req.search || '';
        let lookup = this.lookup;

        res.status(301);

        if (this.lookup[url]) {
            res.redirect(buildUrl(lookup[url], params));

        } else if (this.lookup[hostname + url]) {
            res.redirect(buildUrl(lookup[hostname + url], params));

        } else if (this.lookup[host + url]) {
            res.redirect(buildUrl(lookup[host + url], params));

        } else if (this.lookup[hostname]) {
            res.redirect(buildUrl(lookup[hostname] + url, params));

        } else if (this.lookup[host]) {
            res.redirect(buildUrl(lookup[host] + url, params));

        } else {
            next();
        }
    }
};


module.exports = function(app){
    return new Redirects(app);
}
