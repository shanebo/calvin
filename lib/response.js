

'use strict';


const http = require('http');
const mime = require('mime');
const proto = http.ServerResponse.prototype;
const Beard = require('beard');
const extend = require('util')._extend;


const Response = {

    methods: {

        get: function(header) {
            return this.getHeader(header);
        },

        set: function(header, value) {
            this.setHeader(header, value);
            return this;
        },

        error: function(err, status) {
            var trace = (err.stack || '').split('\n');
            var type = trace[0].replace(err.message, '').replace(':', '');
            var stack = trace.slice(1).map(function(t) {
                return '<li>' + t + '</li>';
            }).join('');
            var body = '';
            body += `<h1>${err}</h1>`;
            body += stack;
            this.status(status).send(body);
        },

        status: function(code) {
            this.statusCode = code;
            return this;
        },

        sendStatus: function(code) {
            this.statusCode = code;
            let message = http.STATUS_CODES[code];
            message ? this.error(new Error(code + ' : ' + message), code) : this.end();
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
                    return this.type('html').end(body);
                default:
                    this.type('text').end(body.toString());
            }
        },

        json: function(body) {
            if (typeof body == 'object') {
                // body = stringify(body, replacer, spaces);
                body = process.env.NODE_ENV == 'development' ?
                    JSON.stringify(body, null, 4) :
                    JSON.stringify(body);
            }
            this.type('json').end(body);
        },

        location: function(url) {
            this.set('Location', url).end();
        },

        redirect: function(url) {
            this.set('Location', url).end();
            // this.set('Location', url).status(status || 302).end();
            // this.writeHead(status || 302, { Location: url });
            // this.end();
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

        partial: function(view, data){
            return this.engines[this.app.settings.engine].render.call(this, this.app.cache['/views/' + view].body, data);
        },

        render: function(/*view, layout, data*/){
            var args = arguments;
            var engine = this.engines[this.app.settings.engine];

            if (arguments.length == 3) {
                var data = args[2];
                var viewBody = engine.render.call(this, this.app.cache['/views/' + args[0]].body, data);
                // var layout = this.app.cache['/views/' + args[1]];
                var layout = extend({}, this.app.cache['/views/' + args[1]]);
                // var layout = cloneObject(this.app.cache['/views/' + args[1]]);
                layout.body = engine.render.call(this, viewBody, layout.body, data);
                this.serve(layout);
            } else {
                var data = args[1];
                var view = extend({}, this.app.cache['/views/' + args[0]]);
                // var view = this.app.cache['/views/' + args[0]];
                // var view = cloneObject(this.app.cache['/views/' + args[0]]);
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

            // this.result = asset; // this gives possibility to cache the final asset
            this.writeHead(200, asset.headers);
            this.end(asset.body);
        }
    }
};


// const cloneObject = function(object){
//     var clone = {};
//     for (var key in object) {
//         if (object.hasOwnProperty(key)) {
//             clone[key] = cloneObject(object[key]);
//         }
//     }
//     return clone;
// }



proto.messages = http.STATUS_CODES;
proto.locals = Object.create(null);
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
