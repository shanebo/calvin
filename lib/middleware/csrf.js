

'use strict';


const CSRF = function(app) {
}


CSRF.prototype = {

    handle: function(req, res, next){
        let session = req.session;
        let csrf = session.get('csrf');

        let tokenMatches = function(){
            if (csrf == undefined) return false;
            let headers = ['csrf-token', 'xsrf-token', 'x-csrf-token', 'x-xsrf-token'];
            let matchesHeader = headers.some(function(header){
                return req.headers[header] == csrf;
            });
            return req.body.csrf == csrf || matchesHeader;
        }

        if (tokenMatches()) {
            next();
        } else {
            req.csrfToken(true);
            res.sendStatus(401);
        }
    }
};


module.exports = function(app){
    return new CSRF(app);
}
