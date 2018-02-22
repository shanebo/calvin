const fs = require('fs');
const traversy = require('traversy');
const path = require('path');
const join = path.join;
const resolve = path.resolve;
const mime = require('mime');
const zlib = require('zlib');

const Static = function(dir, app) {
  this.cache = {};
  this.root = resolve(dir);
  this.keyRegex = new RegExp(`^${this.root}`);

  if (this.root) {
    const filterNonDotFiles = '\/[^\.][^\/]+$';
    traversy(this.root, filterNonDotFiles, this.store.bind(this));
  }
}

Static.prototype = {

  store(path) {
    const asset = buildAsset(path);
    const key = path.replace(this.keyRegex, '');
    this.cache[key] = asset;
  },

  serve(req, res, asset) {
    let etag = req.headers['if-none-match'];
    if (etag == asset.headers.ETag) {
      res.writeHead(304, asset.headers);
      res.end();
      return;
    }

    asset.headers.Date = new Date().toUTCString();
    res.writeHead(200, asset.headers);
    res.end(asset.body);
  },

  handle(req, res, next) {
    const asset = this.cache[req.pathname];

    if (req.method == 'GET' && asset) {
      // this.serve(req, res, asset);
      fs.createReadStream(join(this.root, req.pathname)).pipe(res);
    } else {
      next();
    }
  }
};

function buildAsset(path) {
  const mtime = fs.statSync(path).mtime.toUTCString();
  const body = fs.readFileSync(path);
  const buffer = zlib.gzipSync(body);
  return {
    body: buffer,
    headers: {
      'Cache-Control': 'public',
      'Content-Encoding': 'gzip',
      'Content-Length': buffer.length,
      'Content-Type': mime.lookup(path),
      'ETag': `"${mtime}"`,
      'Last-Modified': mtime,
      'Vary': 'Accept-Encoding'
    }
  };
}

module.exports = (opts, app) => new Static(opts, app);
