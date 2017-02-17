

'use strict';


const http = require('http');
const mime = require('mime');
const clone = require('clone');
const utils = require('./utils');
const proto = http.ServerResponse.prototype;


const Response = {

    properties: {

        messages: function() {
            return http.STATUS_CODES;
        }
    },

    methods: {

        get: function(header) {
            return this.getHeader(header);
        },

        set: function(header, value) {
            this.setHeader(header, value);
            return this;
        },

        error: function(err, status) {
            let message = this.messages[status];
            let errorHandle = this.app.opts.errorHandle;
            let production = this.app.opts.env === 'production';

            if (errorHandle && production) {
                errorHandle.call(errorHandle, this.request, this, err, status, message);

            } else if (production) {
                this.status(status).render('calvin/status', {
                    status: status,
                    message: message
                });

            } else {
                let trace = (err.stack || '').split('\n');
                let type = trace[0].replace(err.message, '').replace(':', '');
                let stack = trace.slice(1).map(function(t){ return '<li>' + t + '</li>'; }).join('');
                this.status(status).render('calvin/trace', {
                    status: status,
                    error: err,
                    type: type,
                    reason: err.message == status.toString() ? message : err.message,
                    stack: stack
                });
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
                replacer = replacer || this.app.opts.json.replacer;
                spaces = spaces || this.app.opts.json.spaces;
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

        partial: function(path, data) {
            return this.app.render(this.app.cache.views[path], data);
        },

        render: function(path, data) {
            this.app.view.render(path, data, this);
        }
    }
};


utils.extendProto(proto, Response);


module.exports = proto;
