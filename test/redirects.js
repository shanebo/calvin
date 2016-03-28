var expect = require('expect.js');
var Redirects = require('../lib/middleware/redirects')({
    settings: {
        redirects: {
            '/foo': '/bar'
        }
    }
});

describe('Redirects', function(){
    describe('lookup', function(){

        describe('when url is present', function(){
            it('returns the lookup value for the url', function(){
                expect(Redirects.lookup['/foo']).to.be('/bar');
            });
        });

        describe('when url is not present', function(){
            it('returns undefined', function(){
                expect(Redirects.lookup['/jack']).to.be(undefined);
            });
        });
    });

    describe('add', function(){
        it('adds a "/from" property to the lookup table', function(){
            Redirects.add('/from', '/to');
            expect(Redirects.lookup['/from']).to.be('/to');
        });
    });

    describe('remove', function(){
        it('should not have "/from" property in lookup table after removing', function(){
            Redirects.remove('/from');
            expect(Redirects.lookup).not.to.have.property('/from');
        });
    });

    describe('reset', function(){
        it('should replace lookup table', function(){
            var lookup = {
                '/new': '/bar'
            };
            Redirects.reset(lookup);
            expect(Redirects.lookup).to.be(lookup);
        });
    });

    describe('empty', function(){
        it('should empty lookup table', function(){
            Redirects.empty();
            expect(Redirects.lookup).to.be.empty();
        });
    });

    describe('redirect to simple match', function(){
        it('should redirect from to empty lookup table', function(){

            Redirects.empty();
            expect(Redirects.lookup).to.be.empty();
        });
    });

    describe('handler', function(){
        it('should redirect to ', function(){
            Redirects.handler({
                    url: '/foo',
                    host: 'www.steadymade.com:3000',
                    hostname: 'www.steadymade.com'
                },
                {
                    redirect: function(url){
                        expect(url).to.be('/bar');
                    }
                },
                function(){
                    expect('test').to.be('test');
                }
            );
        });
    });
});
