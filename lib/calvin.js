const http = require('http');
const Router = require('./router');
const Memcache = require('./memcache');
const Components = require('./components');
const { merge, production } = require('./utils');

require('./request');
require('./response');

class Calvin extends Router {
  constructor(opts) {
    super();
    this.opts = merge({
      middleware: [],
      errorHandle: false,
      engine: {
        name: '../../../beard-repo/beard', // beard
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
    res.app = this;
    res.locals = {};
    res.request = req;
    res.on('error', res.error);
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

  inherit(render, memcache, components, mountPath = '') {
    this.render = render;
    this.memcache = memcache;
    this.components = components;
    this.stack
      .filter(route => route.app)
      .forEach(route => {
        route.app.inherit(render, memcache, components, mountPath + route.pattern);
      });
    this.build(mountPath);
  }

  listen() {
    const Engine = require(this.opts.engine.name);
    const engine = new Engine(this.opts.engine.opts);
    const memcache = Memcache(this.opts, this);
    const components = Components(process.cwd());
    this.inherit(engine.render, memcache, components);
    this.opts.middleware.forEach(ware => this.use(ware));
    if (!this.server) this.createServer();
    return this.server.listen.apply(this.server, arguments);
  }
}

module.exports = opts => new Calvin(opts);
