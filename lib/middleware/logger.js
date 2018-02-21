const Logger = function() {}

Logger.prototype = {

  log(req, res) {
    const duration = new Date - req.startTime;
    const started = `${req.startTime.toLocaleDateString()} ${req.startTime.toLocaleTimeString()}`;
    const msg = `${req.method} "${req.url}" ${res.statusCode} ${duration}ms ${started}`;
    console.log(msg);
  },

  handle(req, res, next) {
    req.startTime = new Date;
    req.on('end', this.log.bind(this, req, res));
    next();
  }
};

module.exports = () => new Logger();
