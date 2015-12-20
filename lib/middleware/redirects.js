

var Redirects = function(app){
    console.log('Initializing Redirects middleware...');
    this.redirects = app.settings.redirects;
}


Redirects.prototype = {

    handler: function(request, response, next){
        var url = request.url;

        if (this.redirects[url]) {
            response.redirect(this.redirects[url], 301);
        } else if (this.redirects[request.hostname]) {
            response.redirect(this.redirects[request.hostname] + url, 301);
        } else {
            next();
        }
    }
};


module.exports = function(app){
    return new Redirects(app);
}
