

'use strict';


const Logger = function(opts) {
}


Logger.prototype = {

    log: function(req, res) {
        let duration = new Date - req.startTime;
        let started = req.startTime.toLocaleDateString() + ' ' + req.startTime.toLocaleTimeString();
        let msg = [req.method, '"' + req.url + '"', res.statusCode, duration + 'ms', started];
        if (res.locals.isCached) msg.splice(3, 0, 'memcached');
        console.log(msg.join(' '));
    },

    handle: function(req, res, next) {
        req.startTime = new Date;
        req.on('end', this.log.bind(this, req, res));
        next();
    }
};


module.exports = function(opts) {
    return new Logger(opts);
}
