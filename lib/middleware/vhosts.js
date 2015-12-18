

var Vhosts = function(app){
    console.log('Initializing Vhost middleware...');
    this.vhosts = app.settings.vhosts;
};


Vhosts.prototype = {

    handler: function(request, response, next){
        if (!request.hostname) return next();
        var server = this.vhosts[request.hostname];

        if (server) {
            server.emit('request', request, response, next);
        } else {
            next();
        }
    }
};


module.exports = function(app){
    return new Vhosts(app);
}
