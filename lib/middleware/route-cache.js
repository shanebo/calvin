class RouteCache {
  constructor(opts, app) {
    this.app = app;
  }

  handle(req, res, next) {
    // this cached locals code has to run AFTER the res.app = this
    // above so that it refers to the subapp
    if (req.method === 'GET') {
      const route = this.app.memcache.in('routes').get(req.url);
      if (route) {
        res.serve('html', route.body);
        // res.serve('html', this.app.render(route.template, route.locals));
      } else {
        next();
      }
    } else {
      next();
    }
  }
}

module.exports = (opts, app) => new RouteCache(opts, app);
