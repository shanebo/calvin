

'use strict';


const Vhost = function(opts) {
    this.vhost = opts || {};
}


Vhost.prototype = {

    handle: function(req, res, next) {
        if (!req.hostname) return next();
        let server = this.vhost[req.hostname];
        if (server) {
            server.emit('req', req, res, next);
        } else {
            next();
        }
    }
};


module.exports = function(opts) {
    return new Vhost(opts);
}
