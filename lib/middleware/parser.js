

var qs = require('qs');
var utils = require('../utils');


var Parser = function(app){
    console.log('Initializing Parser middleware...');
}


Parser.prototype = {

    handler: function(request, response, next){
        if (/^(POST|PUT|PATCH|DELETE)$/i.test(request.method)) {
            var body = '';

            request.on('data', function(data){
                body += data;
            });

            request.on('end', function(){
                request.body = request.is('json') ? JSON.parse(body) : utils.parseObject(qs.parse(body));
                next();
            });

        } else {
            if (request.search) {
                request.query = utils.parseObject(qs.parse(request.search.replace('?', '')));
            }
            next();
        }
    }
};


module.exports = function(app){
    return new Parser(app);
}
