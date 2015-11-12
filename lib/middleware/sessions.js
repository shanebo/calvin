

var qs = require('qs');
var cookies = require('cookies');
var utils = require('../utils.js');
var keygrip = require('keygrip');

var Sessions = function(settings){
    console.log('Initializing Sessions middleware...');
    this.cookie = settings.cookie || 'calvin-session';
    this.key = keygrip([process.env.SESSION_SECRET]);
    this.options = {signed: true};
}


Sessions.prototype = {

	handler: function(request, response, next){
        request.session = {};

        var jar = new cookies(request, response, this.key);
        var cookie = this.cookie;
        var _session = utils.parseObject(qs.parse(jar.get(cookie, this.options)));
        var session = request.session;
        var options = this.options;

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

        next();
    }

};


module.exports = function(settings){
    return new Sessions(settings);
}
