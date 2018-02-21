const Redirect = function (opts = {}) {
  this.lookup = opts;
  this.slashless = true; // need to update the opts
}

Redirect.prototype = {

  add(from, to) {
    this.lookup[from] = to;
  },

  remove(url) {
    delete this.lookup[url];
  },

  reset(lookup = {}) {
    this.lookup = lookup;
  },

  handle(req, res, next) {
    // redirects to pathname without trailing slash
    if (this.slashless && req.pathname !== '/' && /\/$/.test(req.pathname)) {
      res.status(301).redirect(req.url.replace(/\/([^/]*)$/, '$1'));
      return;
    }

    const url = req.url;
    const host = req.host;
    const hostname = req.hostname;
    const params = req.search || '';
    const lookup = this.lookup;

    if (this.lookup[url]) {
      res.status(301).redirect(buildUrl(lookup[url], params));
    } else if (this.lookup[hostname + url]) {
      res.status(301).redirect(buildUrl(lookup[hostname + url], params));
    } else if (this.lookup[host + url]) {
      res.status(301).redirect(buildUrl(lookup[host + url], params));
    } else if (this.lookup[hostname]) {
      res.status(301).redirect(buildUrl(lookup[hostname] + url, params));
    } else if (this.lookup[host]) {
      res.status(301).redirect(buildUrl(lookup[host] + url, params));
    } else {
      next();
    }
  }
};

const buildUrl = (url, params) => url.includes('?') ? url : url + params;

module.exports = opts => new Redirect(opts);
