const { METHODS } = require('http');

class Router {
  constructor() {
    this.stack = [];
    this.mountedApps = [];
    this.mountPath = '';
    this.params = {};
    this.routes = {};
    ['GET', 'POST'].forEach(method => {
      // METHODS.forEach(method => {
      this[method.toLowerCase()] = this.add.bind(this, method);
      this.routes[method] = [];
    });
  }

  create(pattern, handle) {
    return {
      pattern,
      handle
    };
  }

  // create(route, handle) {
  //   const capture = route.replace(/:[^\/:.-]+/g, '([^/]+)').replace('/', '');
  //   const regex = new RegExp(`^/${capture}$`);
  //   const params = getParams(route, regex);
  //   const paramHandles = params
  //     .filter(param => this.params[param])
  //     .map(param => this.params[param]);

  //   if (Array.isArray(handle)) {
  //     // this is a router handle
  //     // frontload paramHandles onto route handles
  //     if (paramHandles.length) {
  //       Array.prototype.unshift.apply(handle, paramHandles);
  //     }

  //     // frontload middleware
  //     const wares = this.stack
  //       .filter(ware => ware.route === '*' || ware.regex.test(route))
  //       .map(ware => ware.handle);

  //     Array.prototype.unshift.apply(handle, wares);
  //     // [ware, ware, paramHandle, paramHandle, prehandle, prehandle, handle]
  //     // this wraps all handles that are apps and binds them to themselves
  //     handle = handle.map(hand => wrap(hand).bind(hand));
  //   }

  //   return {
  //     route,
  //     params,
  //     handle,
  //     regex
  //   };
  // }

  use(...args) {
    const coreWare = typeof args[0] === 'string';
    const ware = args.length === 2
      ? this.create(args.shift(), args[0])
      : this.create('*', coreWare ? this.load(args[0]) : args[0])

    // move all this to the create method
    ware.isApp = ware.handle.hasOwnProperty('stack');
    // ware.isApp = ware.handle instanceof Router;
    if (ware.isApp) {
      ware.handle.parent = this;
      ware.handle.mountPath = ware.pattern;
      this.mountedApps.push(ware.handle);
    }

    this.stack.push(ware);
    return this;
  }

  param(name, handle) {
    this.params[name] = handle;
    return this;
  }

  add(method, route, ...handle) {
    this.routes[method].push(this.create(route, handle));
    return this;
  }

  find(req) {
    const method = req.method;
    // const pathname = req.mountPath;
    const pathname = req.pathname;
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

  build() {
    const parent = this;
    this.stack
      .forEach(ware => {
        // console.log(ware);
        ware.pattern = parent.mountPath + (ware.pattern === '/' ? '' : ware.pattern);
        ware.regex = regexPattern(ware.pattern);
      });

    parent.mountedApps.forEach(subapp => {
      subapp.mountPath = parent.mountPath + subapp.mountPath;

      // subapp.stack
      //   .forEach(ware => {
      //     // console.log(ware);
      //     ware.pattern = parent.mountPath + (ware.pattern === '/' ? '' : ware.pattern);
      //     ware.regex = regexPattern(ware.pattern);
      //   });

      subapp.routes.GET.forEach(route => {
        route.pattern = subapp.mountPath + (route.pattern === '/' ? '' : route.pattern);
        route.regex = regexPattern(route.pattern);
        route.params = getParams(route.pattern, route.regex);

        const paramHandles = route.params
          .filter(param => subapp.params[param])
          .map(param => subapp.params[param]);

        if (Array.isArray(route.handle)) {
          // this is a router handle
          // frontload paramHandles onto route handles
          if (paramHandles.length) {
            Array.prototype.unshift.apply(route.handle, paramHandles);
          }

            // frontload middleware
          const wares = parent.stack
            .filter(ware => {
              return ware.pattern === '*' || route.pattern.match(ware.regex);
            })
            .map(ware => ware.handle);

          Array.prototype.unshift.apply(route.handle, wares);
          route.handle = route.handle.map(hand => wrap(hand).bind(hand));
        }
      });

      subapp.build();
    });
  }
}

function getRoute(pathname, layer) {
  const matches = pathname.match(layer.regex);
  const handle = layer.handle;
  console.log('pathname', pathname);
  console.log('layer.regex', layer.regex);
  console.log('matches', matches);

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

function regexPattern(pattern) {
  const capture = pattern.replace(/:[^\/:.-]+/g, '([^/]+)').replace('/', '');
  return new RegExp(`^/${capture}$`);
}

function getParams(route, regex) {
  let matches = route.match(regex);
  if (matches) {
    matches.shift();
    return matches.map(item => item.replace(':', ''));
  }
  return [];
}

const wrap = layer =>
  layer.handle
    ? (req, res, next) => layer.handle(req, res, next)
    : layer;

// const shiftPath = (path, lastPath) =>
//   path !== lastPath
//     ? path.substr(lastPath.length)
//     : '/';

module.exports = Router;



