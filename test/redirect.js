const chai = require('chai');
const expect = chai.expect;
const Redirect = require('../lib/middleware/redirect')({
  '/foo': '/bar'
});

describe('Redirect', function() {
  describe('lookup', function() {
    describe('when url is present', function() {
      it('returns the lookup value for the url', function() {
        expect(Redirect.lookup['/foo']).to.equal('/bar');
      });
    });

    describe('when url is not present', function() {
      it('returns undefined', function() {
        expect(Redirect.lookup['/jack']).to.equal(undefined);
      });
    });
  });

  describe('add', function() {
    it('adds a "/from" property to the lookup table', function() {
      Redirect.add('/from', '/to');
      expect(Redirect.lookup['/from']).to.equal('/to');
    });
  });

  describe('remove', function() {
    it('should not have "/from" property in lookup table after removing', function() {
      Redirect.remove('/from');
      expect(Redirect.lookup).not.to.have.property('/from');
    });
  });

  describe('reset', function() {
    it('should replace lookup table', function() {
      const lookup = {
        '/new': '/bar'
      };
      Redirect.reset(lookup);
      expect(Redirect.lookup).to.equal(lookup);
    });
  });

  describe('handle', function() {
    it('should redirect to ', function() {
      Redirect.handle({
          url: '/foo',
          host: 'www.steadymade.com:3000',
          hostname: 'www.steadymade.com'
        }, {
          redirect: function(url) {
            expect(url).to.equal('/bar');
          }
        },
        function() {
          expect('test').to.equal('test');
        }
      );
    });
  });
});
