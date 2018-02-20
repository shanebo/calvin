const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const calvin = require('../lib/calvin');
chai.use(chaiHttp);

describe('Router', function() {
  const app = calvin();
  const host = 'http://127.0.0.1:8888';
  app.listen(8888);

  describe('GET', function() {

    it('handles / hello world', (done) => {
      app.get('/', (req, res) => {
        res.end('hello world');
      });

      chai.request(host)
        .get('/')
        .end((err, res) => {
          expect(res.text).to.equal('hello world');
          done();
        });
    });

    it('handles /:name single param', (done) => {
      app.get('/:name', (req, res) => {
        res.end(req.params.name);
      });

      chai.request(host)
        .get('/jack-black')
        .end((err, res) => {
          expect(res.text).to.equal('jack-black');
          done();
        });
    });

    it('handles /articles/:category/:author nested params', (done) => {
      app.get('/articles/:category/:author', (req, res) => {
        res.end(`articles about ${req.params.category} by ${req.params.author}`);
      });

      chai.request(host)
        .get('/articles/salvation/calvin')
        .end((err, res) => {
          expect(res.text).to.equal('articles about salvation by calvin');
          done();
        });
    });

    it('handles /:count(uno|dos|tres) param ranges', (done) => {
      app.get('/:count(uno|dos|tres)', (req, res) => {
        res.end(req.params.count);
      });

      chai.request(host)
        .get('/dos')
        .end((err, res) => {
          expect(res.text).to.equal('dos');
          done();
        });
    });

});




});
