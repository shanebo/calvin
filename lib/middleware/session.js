const qs = require('qs');
const cookies = require('cookies');
const keygrip = require('keygrip');
const crypto = require('crypto');
const { parseObject } = require('../utils.js');

const Session = function (opts = {}, app) {
  this.key = keygrip([opts.secret || 'PutAS3CretHereANDmAK3itSUP3rG00d']);
  this.cookie = opts.cookie || '____calvin';
  this.csrf = opts.csrf || false;
}

Session.prototype = {

  handle(req, res, next) {
    req.session = {};

    const jar = new cookies(req, res, { keys: this.key });
    const options = { signed: true, overwrite: true };
    const cookie = this.cookie;
    let _session = parseObject(qs.parse(jar.get(cookie, options)));
    let session = req.session;

    session.get = (key) => key ? _session[key] : _session;
    session.set = (key, value) => {
      _session[key] = value;
      jar.set(cookie, qs.stringify(_session), options);
      return session;
    }

    session.flash = () => {
      let flash = session.get('flash');
      session.set('flash', '');
      return flash;
    }

    session.reset = () => {
      _session = {};
      jar.set(cookie, qs.stringify(_session), options);
    }

    if (!session.get('flash')) {
      session.set('flash', '');
    }

    if (this.csrf) {
      req.csrfToken = (reset) => {
        const len = 32;
        const newToken = crypto.randomBytes(Math.ceil(len * 3 / 4)).toString('base64').slice(0, len);
        const token = reset ? newToken : (session.get('csrf') || newToken);
        session.set('csrf', token);
        return token;
      }
    }

    next();
  }
};

module.exports = (opts, app) => new Session(opts, app);
