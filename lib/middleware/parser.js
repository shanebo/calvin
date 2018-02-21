const qs = require('qs');
const { parseObject } = require('../utils');

const Parser = function(extended = true) {
  // converts empty strings to null and
  // true/false strings to boolean
  this.extended = extended;
}

Parser.prototype = {

  handle(req, res, next) {
    if (/^(POST|PUT|PATCH|DELETE)$/i.test(req.method)) {
      let body = '';

      req.on('data', (data) => {
        body += data;
      });

      req.on('end', () => {
        req.body = req.is('json')
          ? JSON.parse(body)
          : this.extended
            ? parseObject(qs.parse(body))
            : qs.parse(body);
        next();
      });

    } else {
      next();
    }
  }
};

module.exports = opts => new Parser(opts);
