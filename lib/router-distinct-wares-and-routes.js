const { METHODS } = require('http');

class Router {
  constructor() {
    this.params = {};
    this.routes = {};
    METHODS.forEach(method => {
      this[method.toLowerCase()] = this.add.bind(this, method);
      this.routes[method] = [];
    });
  }

  build(route, handle) {
    const capture = route.replace(/:[^\/:.-]+/g, '([^/]+)').replace('/', '');
    const regex = new RegExp(`^/${capture}$`);
    const params = getParams(route, regex);
    const paramHandles = params
      .filter(param => this.params[param])
      .map(param => this.params[param]);

    if (paramHandles.length && Array.isArray(handle)) {
      // frontload paramHandles onto route handles
      Array.prototype.unshift.apply(handle, paramHandles);
    }

    return {
      route,
      params,
      handle,
      regex
    };
  }

  param(name, handle) {
    this.params[name] = handle;
    return this;
  }

  add(method, route, ...handle) {
    this.routes[method].push(this.build(route, handle));
    return this;
  }

  find(method, pathname) {
    const arr = this.routes[method];
    let i = 0;
    const max = arr.length;
    for (; i < max; i++) {
      const layer = arr[i];
      const match = getRoute(pathname, layer);
      if (match) {
        return match;
        break;
      }
    }
    return false;
  }
}

function getRoute(pathname, layer) {
  const matches = pathname.match(layer.regex);
  const handle = layer.handle;

  if (matches) {
    matches.shift();
    let params = {};

    if (matches.length) {
      let i = 0;
      const max = layer.params.length;
      for (; i < max; i++) {
        params[layer.params[i]] = matches[i];
      }
    }

    return {
      params,
      handle
    };
  }

  return false;
}

function getParams(route, regex) {
  let matches = route.match(regex);
  if (matches) {
    matches.shift();
    return matches.map(item => item.replace(':', ''));
  }
  return [];
}

module.exports = Router;
