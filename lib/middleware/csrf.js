const CSRF = function(opts) {}

CSRF.prototype = {

  handle(req, res, next) {
    if (tokenMatches(req)) {
      next();
    } else {
      req.csrfToken(true);
      res.sendStatus(401);
    }
  }
};

function tokenMatches(req) {
  const csrf = req.session.get('csrf');
  if (csrf == undefined) return false;
  const headers = ['csrf-token', 'xsrf-token', 'x-csrf-token', 'x-xsrf-token'];
  const matchesHeader = headers.some(header => req.headers[header] == csrf);
  return req.body.csrf == csrf || matchesHeader;
}

module.exports = opts => new CSRF(opts);
