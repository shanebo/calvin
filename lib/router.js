const is = require('is');
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

class Router {
  constructor() {
    this.wares = [];
    this.stack = [];
    this.params = {};
    this.routes = {};
    METHODS.forEach(method => {
      this[method.toLowerCase()] = this.create.bind(this, method);
      this.routes[method] = {};
    });
  }

  load(ware) {
    return require(`./middleware/${ware}`)(this.opts[ware], this);
  }

  param(name, handle) {
    this.params[name] = handle;
    return this;
  }

  use(ware) {
    const handle = is.string(ware) ? this.load(ware) : ware;
    this.wares.push(wrap(handle).bind(handle));
    return this;
  }

  create(method, pattern, ...handles) {
    this.stack.push(buildRoute(method, pattern, handles));
    return this;
  }

  mount(pattern, app) {
    const handles = [wrap(app).bind(app)];
    this.stack.push(buildRoute('*', pattern, handles, app));
    return this;
  }

  build(mountPath) {
    this.stack.forEach(route => {
      route.pattern = mountPath + (route.pattern === '/' ? '' : route.pattern);

      if (route.app || route.pattern.includes(':')) {
        route.regex = patternRegex(route);
        route.params = getParams(route);
        const paramHandles = route.params
          .filter(param => this.params[param])
          .map(param => this.params[param]);
        route.handles = [].concat(paramHandles, route.handles);
      } else {
        route.pathname = (route.pattern === '' ? '/' : route.pattern);
      }

      const key = keyFor(route.pattern);
      const methods = route.method === '*' ? METHODS : [route.method];
      methods.forEach(method => {
        if (!this.routes[method][key]) {
          this.routes[method][key] = [];
        }
        this.routes[method][key].push(route);
      });
    });
  }

  find(req, key = req.pathname.charAt(1) || '/') {
    const arr = this.routes[req.method][key];
    if (!arr) return false;
    let i = 0;
    for (; i < arr.length; i++) {
      const route = arr[i];
      const handles = getHandles(req, route);
      if (handles) {
        return handles;
        break;
      }
    }
    return false;
  }
}

function buildRoute(method, pattern, handles, app = false) {
  return {
    method,
    pattern,
    handles,
    app
  };
}

function getHandles(req, route) {
  if (route.pathname) {
    return route.pathname === req.pathname
      ? route.handles
      : false;
  }

  const matches = req.pathname.match(route.regex);
  if (matches) {
    matches.shift();
    req.params = {};
    let i = 0;
    for (; i < route.params.length; i++) {
      req.params[route.params[i]] = matches[i];
    }
    return route.handles;
  }

  return false;
}

const keyFor = pattern => {
  const char = pattern.charAt(1);
  return char === ':' || char === '' ? '/' : char;
}

const wrap = layer =>
  layer.handle
    ? (req, res, next) => layer.handle(req, res, next)
    : layer;

function patternRegex(route) {
  const capture = route.pattern === '' ? '/' : route.pattern.replace(/:[^\/:.-]+/g, '([^/]+)');
  const regex = route.app ? `^${capture}.*$` : `^${capture}$`;
  return new RegExp(regex);
}

function getParams(route) {
  let matches = route.pattern.match(route.regex);
  if (matches) {
    matches.shift();
    return matches.map(item => item.replace(':', ''));
  }
  return [];
}

module.exports = Router;
