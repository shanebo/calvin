

var qs = require('qs');
var cookies = require('cookies');
var utils = require('../utils.js');
var keygrip = require('keygrip');
var crypto = require('crypto');


var Sessions = function(settings){
    console.log('Initializing Sessions middleware...');
    this.key = keygrip([process.env.SESSION_SECRET]);
    this.cookie = settings.sessions.cookie || 'calvin-session';
    this.csrf = settings.sessions.csrf || false;
}


Sessions.prototype = {

    handler: function(request, response, next){
        request.session = {};

        var jar = new cookies(request, response, this.key);
        var options = { signed: true, overwrite: true };
        var cookie = this.cookie;
        var _session = utils.parseObject(qs.parse(jar.get(cookie, options)));
        var session = request.session;

        session.get = function(key){
            return key ? _session[key] : _session;
        }

        session.set = function(key, value){
            _session[key] = value;
            jar.set(cookie, qs.stringify(_session), options);
        }

        session.flash = function(){
            var flash = session.get('flash');
            session.set('flash', '');
            return flash;
        }

        session.reset = function(){
            _session = {};
            jar.set(cookie, qs.stringify(_session), options);
        }

        if (!session.get('flash')) {
            session.set('flash', '');
        }

        if (this.csrf) {
            request.csrfToken = function(reset){
                var len = 32;
                var newToken = crypto.randomBytes(Math.ceil(len * 3 / 4)).toString('base64').slice(0, len);
                var token = reset ? newToken : (session.get('csrf') || newToken);
                session.set('csrf', token);
                return token;
            }
        }

        next();
    }
};


module.exports = function(settings){
    return new Sessions(settings);
}
