const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const calvin = require('../lib/calvin');
const session = require('../lib/middleware/session');
chai.use(chaiHttp);

describe('Session Middleware', function() {
  const agent = chai.request.agent('http://127.0.0.1:8888');
  let app;

  beforeEach(() => {
    app = calvin();
    app.use(session({csrf: true}));
  });
  afterEach(() => app.server.close());

  it('handles getting and setting session values', (done) => {
    app.get('/', (req, res) => {
      const name = req.session.get('name') ? req.session.get('name') : '';
      req.session.set('name', req.query['name']);
      res.end('session name = ' + name);
    });
    app.listen(8888);

    agent.get('/?name=john')
      .end((err, res) => {
        expect(res.text).to.equal('session name = ');

        agent.get('/')
          .end((err, res) => {
            expect(res.text).to.equal('session name = john');
            done();
          });
      });
  });

  it('allows flash to be accessed once', (done) => {
    app.get('/setflash', (req, res) => {
      req.session.set('flash', 'set!');
      res.end('flash set');
    });
    app.get('/getflash', (req, res) => {
      res.end('flash is ' + req.session.flash() + ' and is ' + req.session.flash());
    });
    app.listen(8888);

    agent.get('/setflash')
      .end((err, res) => {
        agent.get('/getflash')
          .end((err, res) => {
            expect(res.text).to.equal('flash is set! and is ');
            done();
          });
      });
  });

  it('sets a csrf token', (done) => {
    app.get('/csrf', (req, res) => {
      res.end('token = ' + req.csrfToken());
    });
    app.listen(8888);

    agent.get('/csrf')
      .end((err, res) => {
        // expect(res.text).to.equal('csrf = fda');
        expect(res.text).to.match(/^token = /);
        expect(res.text).to.have.lengthOf(40);
        done();
      });
  });
});
