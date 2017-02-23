

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
        let asset = {
            body: body,
            headers: {
                'Cache-Control': 'no-cache',
                'Content-Type': 'text/html',
                'Content-Length': Buffer.byteLength(body, 'utf8'),
                'Date': new Date().toUTCString(),
                'Vary': 'Accept-Encoding'
            }
        };
        res.writeHead(200, asset.headers);
        res.end(asset.body);
    }
};


module.exports = function(opts, app){
    return new View(opts, app);
}
