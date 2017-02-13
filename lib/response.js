

'use strict';


const http = require('http');
const mime = require('mime');
const proto = http.ServerResponse.prototype;
const Beard = require('beard');
const utils = require('./utils');


const Response = {

    methods: {

        get: function(header) {
            return this.getHeader(header);
        },

        set: function(header, value) {
            this.setHeader(header, value);
            return this;
        },

        engines: {
            beard: {
                render: function(/*view, layout, data*/){
                    var template, data;
                    var args = arguments;

                    if (args.length == 3) {
                        args[1] += "{block 'view'}" + args[0] + "{endblock}";
                        template = args[1];
                        data = args[2];
                    } else {
                        template = args[0];
                        data = args[1];
                    }

                    data = data || {};
                    data.include = function(path){
                        return this.partial(path, data);
                    }.bind(this);

                    return Beard.render(template, data);
                }
            }
            // mustache: function(template, data){
            //     return Mustache.to_html(template, data);
            // }
        },

        error: function(err, status) {
            let message = this.messages[status];
            let errorHandle = this.app.settings.errorHandle;
            let production = this.app.settings.environment === 'production';

            if (errorHandle && production) {
                errorHandle.call(errorHandle, this.request, this, err, status, message);

            } else if (production) {
                let body = this.partial('calvin/status.html', { status: status, message: message });
                this.status(status).send(body);

            } else {
                let trace = (err.stack || '').split('\n');
                let type = trace[0].replace(err.message, '').replace(':', '');
                let stack = trace.slice(1).map(function(t){ return '<li>' + t + '</li>'; }).join('');
                let body = this.partial('calvin/trace.html', {
                    status: status,
                    error: err,
                    type: type,
                    reason: err.message == status.toString() ? message : err.message,
                    stack: stack
                })
                this.status(status).send(body);
            }
        },

        status: function(code) {
            this.statusCode = code;
            return this;
        },

        sendStatus: function(code) {
            this.status(code);
            let message = this.messages[code];
            message && code >= 400
                ? this.error(new Error(code + ' : ' + message), code)
                : this.end();
        },

        type: function(value) {
            this.set('Content-Type', mime.lookup(value));
            return this;
        },

        send: function(body) {
            switch (typeof body) {
                case 'object':
                    return this.json(body);

                case 'string':
                    if (!this.get('Content-Type')) {
                        this.type('html');
                    }
                    return this.end(body);

                default:
                    this.type('text').end(body.toString());
            }
        },

        json: function(body, replacer, spaces) {
            if (typeof body == 'object') {
                replacer = replacer || this.app.settings.json.replacer;
                spaces = spaces || this.app.settings.json.spaces;
                body = JSON.stringify(body, replacer, spaces);
            }
            this.type('json').end(body);
        },

        location: function(url) {
            this.set('Location', url).end();
        },

        redirect: function(url) {
            let code = this.statusCode;
            if (!(code == 301 || code == 302)) this.status(302);
            this.set('Location', url).end();
        },

        partial: function(view, data){
            return this.engines[this.app.settings.cache.engine].render.call(this, this.app.stash['/views/' + view].body, data);
        },

        render: function(/*view, layout, data*/){
            var args = arguments;
            var engine = this.engines[this.app.settings.cache.engine];

            if (arguments.length == 3) {
                var data = args[2];
                var viewBody = engine.render.call(this, this.app.stash['/views/' + args[0]].body, data);
                var layout = utils.cloneObject(this.app.stash['/views/' + args[1]]);

                layout.body = engine.render.call(this, viewBody, layout.body, data);
                this.serve(layout);
            } else {
                var data = args[1];
                var view = utils.cloneObject(this.app.stash['/views/' + args[0]]);
                view.body = engine.render.call(this, view.body, data);
                this.serve(view);
            }
        },

        serve: function(asset){
            var etag = this.request.headers['if-none-match'];

            if (etag && etag == asset.headers['ETag']) {
                this.writeHead(304, asset.headers);
                this.end();
                return;
            }

            asset.headers['Date'] = new Date().toUTCString();

            if (asset.headers['Content-Type'] == 'text/html') {
                asset.headers['Content-Length'] = Buffer.byteLength(asset.body, 'utf8');
                asset.headers['Vary'] = 'Accept-Encoding';
            }

            this.result = asset; // this gives possibility to cache the final asset
            this.writeHead(200, asset.headers);
            this.end(asset.body);
        }
    }
};


proto.messages = http.STATUS_CODES;
proto.get = Response.methods.get;
proto.set = Response.methods.set;
proto.status = Response.methods.status;
proto.type = Response.methods.type;
proto.send = Response.methods.send;
proto.sendStatus = Response.methods.sendStatus;
proto.json = Response.methods.json;
proto.error = Response.methods.error;
proto.location = Response.methods.location;
proto.redirect = Response.methods.redirect;
proto.partial = Response.methods.partial;
proto.render = Response.methods.render;
proto.serve = Response.methods.serve;
proto.engines = Response.methods.engines;


module.exports = proto;
