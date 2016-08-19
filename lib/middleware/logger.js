

'use strict';


const Logger = function(app){
}


Logger.prototype = {

    logger: function(req, res){
        let duration = new Date - req.startTime;
        let started = req.startTime.toLocaleDateString() + ' ' + req.startTime.toLocaleTimeString();
        let log = [req.method, '"' + req.url + '"', res.statusCode, duration + 'ms', started].join(' ');
        console.log(log);
    },

    handle: function(req, res, next){
        req.startTime = new Date;
        req.on('end', this.logger.bind(this, req, res));
        next();
    }
};


module.exports = function(app){
    return new Logger(app);
}
