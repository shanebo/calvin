const chai = require('chai');
const expect = chai.expect;
const csrf = require('../lib/middleware/csrf')();

describe('Csrf Middleware', function() {
  let status = 200;
  const req = {
    session: {
      get: val => 'token-value'
    },
    headers: {},
    body: {
      csrf: 'token-value'
    },
    csrfToken: _ => true
  };
  const res = {
    sendStatus: (s) => { status = s; }
  };

  describe('handle', function() {
    it('call next when tokens match', function() {
      let nextCalled = false;
      csrf.handle(req, res, () => { nextCalled = true });
      expect(nextCalled).to.equal(true);
    });

    it('sends a 401 when the tokens do not match', function() {
      req.body.csrf = 'bad-token';
      let nextCalled = false;
      csrf.handle(req, res, () => { nextCalled = true });
      expect(nextCalled).to.equal(false);
      expect(status).to.equal(401);
    });
  });
});
