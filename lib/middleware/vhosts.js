

'use strict';


const Vhosts = function(app){
    this.vhosts = app.settings.vhosts;
}


Vhosts.prototype = {

    handle: function(req, res, next){
        if (!req.hostname) return next();
        let server = this.vhosts[req.hostname];

        if (server) {
            server.emit('req', req, res, next);
        } else {
            next();
        }
    }
};


module.exports = function(app){
    return new Vhosts(app);
}
