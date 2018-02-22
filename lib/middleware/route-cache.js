class RouteCache {
  constructor(opts, app) {
    this.cache = {};
  }

  handle(req, res, next) {
    // this cached locals code has to run AFTER the res.app = this
    // above so that it refers to the subapp
    console.log('ROUTE CACHE IS HAPPENING!!!');
    if (req.method === 'GET') {
      const route = this.cache[req.url];
      if (route) {
        console.log('IM RESPONDING A CACHED ROUTE');
        res.serve('html', route.body);
        // res.serve('html', this.app.render(route.template, route.locals));
      } else {
        console.log('IM NOT A CACHED ROUTE');
        res.on('finish', () => {
          console.log('RES FINISH!!!');
          if (res.result) {
            this.cache[req.url] = res.result;
          }
        });
        next();
      }
    } else {
      next();
    }
  }
}

module.exports = (opts, app) => new RouteCache(opts, app);
