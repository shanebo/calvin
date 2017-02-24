

'use strict';


const utils = require('./utils');


const View = function(opts, app) {
    let Engine = require(opts.engine);
    let engine = new Engine(app.cache.views);
    this.app = app;
    this.app.render = engine.render.bind(engine);

    app.memcache.in('views').store(__dirname + '/public/status.beard', 'calvin/status');
    app.memcache.in('views').store(__dirname + '/public/trace.beard', 'calvin/trace');

    if (utils.exists(opts.views)) {
        app.memcache.in('views').cache(opts.views);
        app.memcache.watch(opts.views, function() {
            app.memcache.in('views').cache(opts.views);
        });
    }
}


View.prototype = {

    render: function(path, data, res) {
        let view = this.app.cache.views[path];
        let locals = utils.merge(res.locals, data);
        let body = res.app.render(view, locals);
        res.set('Cache-Control', 'no-cache');
        res.set('Content-Type', 'text/html');
        res.set('Content-Length', Buffer.byteLength(body, 'utf8'));
        res.set('Date', new Date().toUTCString());
        res.set('Vary', 'Accept-Encoding');
        res.end(body);
    }
};


module.exports = function(opts, app){
    return new View(opts, app);
}
