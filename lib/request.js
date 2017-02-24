

'use strict';


const http = require('http');
const proto = http.IncomingMessage.prototype;
const typeis = require('type-is');
const parseurl = require('parseurl');
const utils = require('./utils');


const Request = {

    properties: {

        ip: function() {
            return this.ips[0] || this.connection.remoteAddress;
        },

        ips: function() {
            return (this.get('x-forwarded-for') || '').split(',');
        },

        xhr: function() {
            return (this.get('x-requested-with') || '').toLowerCase() === 'xmlhttprequest';
        },

        ua: function() {
            return this.get('user-agent');
        },

        originalUrl: function() {
            return (this.connection.encrypted ? 'https://' : 'http://') + this.headers.host + this.url;
        }
    },

    methods: {

        is: function(types) {
            let arr = types;
            if (!Array.isArray(types)) {
                arr = new Array(arguments.length);
                for (var i = 0; i < arr.length; i++) {
                    arr[i] = arguments[i];
                }
            }
            return typeis(this, arr);
        },

        get: function(header) {
            return this.headers[header.toLowerCase()];
        }
    }
};


[
    'protocol',
    'slashes',
    'auth',
    'host',
    'port',
    'hostname',
    'hash',
    'search',
    'pathname',
    'path',
    'href'
].forEach(function(prop) {
    utils.defineProperty(proto, prop, function() {
        return parseurl.original(this)[prop];
    });
});

utils.extendProto(proto, Request);


module.exports = proto;
