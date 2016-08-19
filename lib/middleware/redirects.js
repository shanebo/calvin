

'use strict';


const Redirects = function(app){
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

        if (this.lookup[url]) {
            res.status(301).redirect(buildUrl(lookup[url], params));

        } else if (this.lookup[hostname + url]) {
            res.status(301).redirect(buildUrl(lookup[hostname + url], params));

        } else if (this.lookup[host + url]) {
            res.status(301).redirect(buildUrl(lookup[host + url], params));

        } else if (this.lookup[hostname]) {
            res.status(301).redirect(buildUrl(lookup[hostname] + url, params));

        } else if (this.lookup[host]) {
            res.status(301).redirect(buildUrl(lookup[host] + url, params));

        } else {
            next();
        }
    }
};


module.exports = function(app){
    return new Redirects(app);
}
