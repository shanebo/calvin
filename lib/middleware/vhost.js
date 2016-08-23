

'use strict';


const Vhost = function(app){
    this.vhost = app.settings.vhost;
}


Vhost.prototype = {

    handle: function(req, res, next){
        if (!req.hostname) return next();
        let server = this.vhost[req.hostname];

        if (server) {
            server.emit('req', req, res, next);
        } else {
            next();
        }
    }
};


module.exports = function(app){
    return new Vhost(app);
}
