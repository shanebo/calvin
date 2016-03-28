var expect = require('expect.js');
var Memcache = require('../lib/middleware/memcache')({
    settings: {
        memcache: [{
            url: '/foo',
            expires: false
        }]
    }
});



describe('Memcache', function(){

    describe('createLookup', function(){
        it('should create a lookup object', function(){
            expect(Memcache.lookup).to.be.an('object');
        });
    });

    describe('add', function(){
        it('should add a url to for caching to the lookup object', function(){
            Memcache.add({
                url: '/boo',
                expires: false
            });
            expect(Memcache.lookup['/boo'].url).to.be('/boo');
        });
    });
});
