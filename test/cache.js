var expect = require('expect.js');
var Cache = require('../lib/middleware/memcache')({
    settings: {
        cache: {
            urls: [{
                url: '/foo',
                expires: false
            }]
        }
    }
});



describe('Cache', function(){

    describe('createLookup', function(){
        it('should create a lookup object', function(){
            expect(Cache.lookup).to.be.an('object');
        });
    });

    describe('add', function(){
        it('should add a url to for caching to the lookup object', function(){
            Cache.add({
                url: '/boo',
                expires: false
            });
            expect(Cache.lookup['/boo'].url).to.be('/boo');
        });
    });
});
