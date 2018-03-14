const http = require('http');
const Router = require('./router');
const Components = require('./components');
const { merge, production } = require('./utils');

require('./request');
require('./response');

class Calvin extends Router {
  constructor(opts) {
    super();
    this.opts = merge({
      errorHandle: false,
      engine: {
        name: 'beard',
        opts: {
          root: process.cwd(),
          cache: production
        }
      }
    }, opts);
  }

  createServer() {
    this.server = http.createServer(this.hydrate.bind(this));
    return this.server;
  }

  hydrate(req, res) {
    req.response = res;
    res.app = this; // do we need this?
    res.locals = {};
    res.request = req;
    res.components = this.components;
    res.on('error', res.error); // do we need this?
    this.handle(req, res);
  }

  handle(req, res) {
    let w = 0;
    const nextWare = () => {
      const ware = this.wares[w++];
      if (ware) {
        ware(req, res, nextWare);
      } else {
        const handles = this.find(req) || this.find(req, '/');
        if (handles) {
          let h = 0;
          const nextHandle = () => {
            handles[h++](req, res, nextHandle);
          }
          nextHandle();
        } else {
          res.sendStatus(404);
        }
      }
    }

    try {
      nextWare();
    } catch (e) {
      res.error(e, 500);
    }
  }

  inherit(render, components, mountPath = '') {
    this.render = render;
    this.components = components;
    this.stack
      .filter(route => route.app)
      .forEach(route => {
        route.app.inherit(render, components, mountPath + route.pattern);
      });
    this.build(mountPath);
  }

  listen() {
    const beard = require(this.opts.engine.name);
    const engine = beard(this.opts.engine.opts);
    const components = Components(process.cwd()).wrap(this);
    this.inherit(engine.render.bind(engine), components);
    if (!this.server) this.createServer();
    return this.server.listen.apply(this.server, arguments);
  }
}

module.exports = opts => new Calvin(opts);
