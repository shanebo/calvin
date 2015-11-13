

var crypto = require('crypto');


var CSRF = function(settings) {
    console.log('Initializing CSRF middleware...');
}


CSRF.prototype = {

    handler: function(request, response, next){
        var session = request.session;
        var csrf = session.get('csrf');

        var tokenMatches = function(){
            if (csrf == undefined) return false;

            var headers = ['csrf-token', 'xsrf-token', 'x-csrf-token', 'x-xsrf-token'];
            var matchesHeader = headers.some(function(header){
                return request.headers[header] == csrf;
            });
            return request.body.csrf == csrf || matchesHeader;
        }

        request.csrfToken = function(reset){
            var len = 32;
            var token = crypto.randomBytes(Math.ceil(len * 3 / 4)).toString('base64').slice(0, len);
            var csrf = reset ? token : (csrf || token);
            session.set('csrf', csrf);
            return csrf;
        }

        if (/^(GET|HEAD|OPTIONS|TRACE)$/.test(request.method)) {
            next();

        } else if (tokenMatches()) {
            next();

        } else {
            request.csrfToken(true);
            response.send(401);
        }
    }

};


module.exports = function(settings){
    return new CSRF(settings);
}
