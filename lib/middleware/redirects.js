

var Redirects = function(settings) {
    console.log('Initializing Redirects middleware...');
    this.redirects = this.prepare(settings.redirects);
}


Redirects.prototype = {

    prepare: function(redirects){
        if (redirects) {
            var prepped = {};
            for (var prop in redirects) {
                if (redirects.hasOwnProperty(prop)) {
                    prepped[prop.toLowerCase()] = redirects[prop];
                }
            }
            return prepped;
        } else {
            return {};
        }
    },

    handler: function(request, response, next){
        var url = request.url.toLowerCase();
        var domain = request.protocol + '//' + request.hostname;

        if (this.redirects[url]) {
            response.redirect(this.redirects[url], 301);
        } else if (!request.hostname) {
            next();
        } else if (this.redirects[domain]) {
            response.redirect(this.redirects[domain] + url, 301);
        } else {
            next();
        }
    }
};


module.exports = function(settings){
    return new Redirects(settings);
}
