

'use strict';


const qs = require('qs');
const utils = require('../utils');


const Parser = function(app){
    // check if user wants to convert empty strings to null and
    // true false strings as boolean true/false
}


Parser.prototype = {

    handle: function(req, res, next){
        if (/^(POST|PUT|PATCH|DELETE)$/i.test(req.method)) {
            let body = '';

            req.on('data', function(data){
                body += data;
            });

            req.on('end', function(){
                req.body = req.is('json') ? JSON.parse(body) : utils.parseObject(qs.parse(body));
                next();
            });

        } else {
            next();
        }
    }
};


module.exports = function(app){
    return new Parser(app);
}
