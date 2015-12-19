

var parser = require('ua-parser-js');


var Detection = function(app){
    console.log('Initializing Detection middleware...');
}


Detection.prototype = {

    modern: function(ua){
        return !/firefox\/[1-3]{1}\.|msie [1-8]{1}\.|chrome\/[1-6]{1}\.|version\/[0-3]{1}\.[0-9]+(\.[0-9])? safari/i.test(ua);
    },

    handler: function(request, response, next){
        if (request.session && request.session.get('detection')) return next();
        request.session.set('detection', parser(request.headers['user-agent']));
        next();
    }
};


module.exports = function(app){
    return new Detection(app);
}
