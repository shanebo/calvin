const Vhost = function(opts = {}) {
  this.vhosts = opts;
}

Vhost.prototype = {

  handle(req, res, next) {
    if (!req.hostname) return next();
    const server = this.vhosts[req.hostname];
    if (server) {
      server.emit('request', req, res, next);
    } else {
      next();
    }
  }
};

module.exports = opts => new Vhost(opts);
