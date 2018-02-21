const Router = require('./router');
const http = require('http');

require('./request');
require('./response');

class Calvin extends Router {
  constructor() {
    super();
    this.name = 'calvin';
    this.stack = [];
    this.mountedApps = [];
  }

  load(ware) {
    return 'return core middleware';
  }

  use(...args) {
    const coreWare = typeof args[0] === 'string';
    const ware = args.length === 2
      ? this.build(args.shift(), args[0])
      : this.build('*', coreWare ? this.load(args[0]) : args[0])

    ware.isApp = ware.handle instanceof Calvin;

    if (ware.isApp) {
      ware.handle.parent = this;
      ware.handle.mountPath = ware.route;
      this.mountedApps.push(ware.handle);
    }

    this.stack.push(ware);
    return this;
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
    let s = 0;

    const next = () => {
      const ware = this.stack[s++];

      if (ware) {
        if (isWrongSubApp(ware, req))
          return next();

        if (ware.isApp)
          req.mountPath = shiftPath(req.mountPath, ware.handle.mountPath);

        wrap(ware.handle)(req, res, next);

      } else {
        const route = this.find(req.method, req.mountPath);

        if (route) {
          req.params = route.params;

          let h = -1;
          function handle() {
            h += 1;
            const hand = route.handle[h];
            const fn = wrap(hand);
            return h !== route.handle.length - 1
              ? fn.bind(hand, req, res, handle())
              : fn.bind(hand, req, res);
          }
          handle()();

        } else {
          console.log('done');
          // defer(() => {
          //   res.sendStatus(404); // done
          // });
        }
      }
    }

    next();
  }

  createServer() {
    this.server = http.createServer(this.hydrate.bind(this));
    return this.server;
  }

  listen() {
    if (!this.server) this.createServer();
    return this.server.listen.apply(this.server, arguments);
  }
}

const isWrongSubApp = (ware, req) =>
  ware.isApp
    && ware.route !== '*'
    && req.mountPath.substr(0, ware.route.length) !== ware.route;

const shiftPath = (path, lastPath) =>
  path !== lastPath
    ? path.substr(lastPath.length)
    : '/';

const wrap = layer =>
  layer.handle
    ? (req, res, next) => layer.handle(req, res, next)
    : layer;

const defer = typeof setImmediate === 'function'
  ? setImmediate
  : fn => { process.nextTick(fn.bind.apply(fn, arguments)); };

module.exports = opts => new Calvin(opts);
