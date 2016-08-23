

'use strict';


const qs = require('qs');
const cookies = require('cookies');
const utils = require('../utils.js');
const keygrip = require('keygrip');
const crypto = require('crypto');


const Session = function(app){
    this.key = keygrip([app.settings.session.secret || 'PutAS3CretHereANDmAK3itSUP3rG00d']);
    this.cookie = app.settings.session.cookie || 'calvin-session';
    this.csrf = app.settings.session.csrf || false;
}


Session.prototype = {

    handle: function(req, res, next){
        req.session = {};

        let jar = new cookies(req, res, this.key);
        let options = { signed: true, overwrite: true };
        let cookie = this.cookie;
        let _session = utils.parseObject(qs.parse(jar.get(cookie, options)));
        let session = req.session;

        session.get = function(key){
            return key ? _session[key] : _session;
        }

        session.set = function(key, value){
            _session[key] = value;
            jar.set(cookie, qs.stringify(_session), options);
        }

        session.flash = function(){
            let flash = session.get('flash');
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
            req.csrfToken = function(reset){
                let len = 32;
                let newToken = crypto.randomBytes(Math.ceil(len * 3 / 4)).toString('base64').slice(0, len);
                let token = reset ? newToken : (session.get('csrf') || newToken);
                session.set('csrf', token);
                return token;
            }
        }

        next();
    }
};


module.exports = function(app){
    return new Session(app);
}
