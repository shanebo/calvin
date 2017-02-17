

'use strict';


const qs = require('qs');
const utils = require('../utils');


const Parser = function(opts) {
    this.opts = opts || {
        // converts empty strings to null and
        // true/false strings to boolean
        extended: true
    };
}


Parser.prototype = {

    handle: function(req, res, next) {
        if (/^(POST|PUT|PATCH|DELETE)$/i.test(req.method)) {
            let body = '';
            let opts = this.opts;

            req.on('data', function(data) {
                body += data;
            });

            req.on('end', function() {
                req.body = req.is('json')
                    ? JSON.parse(body)
                    : opts.extended
                        ? utils.parseObject(qs.parse(body))
                        : qs.parse(body);
                next();
            });

        } else {
            next();
        }
    }
};


module.exports = function(opts) {
    return new Parser(opts);
}
