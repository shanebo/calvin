

'use strict';


const parser = require('ua-parser-js');


const Detection = function(opts) {
}


Detection.prototype = {

    modern: function(ua) {
        return !/firefox\/[1-3]{1}\.|msie|chrome\/[1-6]{1}\.|version\/[0-3]{1}\.[0-9]+(\.[0-9])? safari/i.test(ua);
    },

    handle: function(req, res, next) {
        if (req.session && req.session.get('detection')) return next();
        let ua = req.headers['user-agent'];
        let results = parser(ua);
        results.browser.modern = this.modern(ua);
        req.session.set('detection', results);
        next();
    }
};


module.exports = function(opts) {
    return new Detection(opts);
}
