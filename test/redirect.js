var expect = require('expect.js');
var Redirect = require('../lib/middleware/redirect')({
    '/foo': '/bar'
});

describe('Redirect', function(){
    describe('lookup', function(){

        describe('when url is present', function(){
            it('returns the lookup value for the url', function(){
                expect(Redirect.lookup['/foo']).to.be('/bar');
            });
        });

        describe('when url is not present', function(){
            it('returns undefined', function(){
                expect(Redirect.lookup['/jack']).to.be(undefined);
            });
        });
    });

    describe('add', function(){
        it('adds a "/from" property to the lookup table', function(){
            Redirect.add('/from', '/to');
            expect(Redirect.lookup['/from']).to.be('/to');
        });
    });

    describe('remove', function(){
        it('should not have "/from" property in lookup table after removing', function(){
            Redirect.remove('/from');
            expect(Redirect.lookup).not.to.have.property('/from');
        });
    });

    describe('reset', function(){
        it('should replace lookup table', function(){
            var lookup = {
                '/new': '/bar'
            };
            Redirect.reset(lookup);
            expect(Redirect.lookup).to.be(lookup);
        });
    });

    describe('empty', function(){
        it('should empty lookup table', function(){
            Redirect.empty();
            expect(Redirect.lookup).to.be.empty();
        });
    });

    describe('redirect to simple match', function(){
        it('should redirect from to empty lookup table', function(){

            Redirect.empty();
            expect(Redirect.lookup).to.be.empty();
        });
    });

    describe('handle', function(){
        it('should redirect to ', function(){
            Redirect.handle({
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
