

var qs = require('qs');
var cookies = require('cookies');


var Sessions = function(settings){
    console.log('Initializing Sessions middleware...');
    this.cookie = settings.cookie || 'calvin-session';
}


Sessions.prototype = {

	handler: function(request, response, next){
        request.session = {};

        var jar = new cookies(request, response);
        var cookie = this.cookie;
        var _session = qs.parse(jar.get(cookie));
        var session = request.session;

        session.get = function(key){
            return key ? _session[key] : _session;
        }

        session.set = function(key, value){
            _session[key] = value;
            jar.set(cookie, qs.stringify(_session));
        }

        session.flash = function(){
            var flash = session.get('flash');
            session.set('flash', '');
            return flash;
        }

        session.reset = function(){
            _session = {};
            jar.set(cookie, qs.stringify(_session));
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
