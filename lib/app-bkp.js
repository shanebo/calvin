const Router = require('./router');
const http = require('http');
const clone = require('clone');

require('./request');
require('./response');

class Calvin extends Router {
  constructor() {
    super();
    this.name = 'calvin';
  }

  hydrate(req, res) {
    req.mountPath = req.pathname;
    req.body = {};
    req.response = res;
    res.locals = {};
    res.request = req;
    this.handle(req, res);
  }

  handle(req, res) {
    const route = this.find(req);

    if (route) {
      req.params = route.params;

      let n = 0;
      function next() {
        route.handle[n++](req, res, next);
      }
      next();

    } else {
      // put defer here
      console.log('not found');
    }
  }

  createServer() {
    this.server = http.createServer(this.hydrate.bind(this));
    return this.server;
  }

  listen() {
    this.build();
    if (!this.server) this.createServer();
    return this.server.listen.apply(this.server, arguments);
  }
}

// const defer = typeof setImmediate === 'function'
//   ? setImmediate
//   : fn => { process.nextTick(fn.bind.apply(fn, arguments)); };


module.exports = opts => new Calvin(opts);
