

'use strict';


const http = require('http');
const proto = http.IncomingMessage.prototype;
const typeis = require('type-is');
const qs = require('qs');
const parseurl = require('parseurl');
const utils = require('./utils');
const defineGetter = function(obj, name, getter) {
    Object.defineProperty(obj, name, {
        get: getter
    });
};

// const defineGetter = function(obj, name, getter, setter) {
//     let descriptor = {};
//     if (getter) descriptor.get = getter;
//     if (setter) descriptor.set = setter;
//     Object.defineProperty(obj, name, descriptor);
// };


const Request = {

    properties: {

        ip: function(){
            return this.ips[0] || this.connection.remoteAddress;
        },

        ips: function(){
            return (this.get('x-forwarded-for') || '').split(',');
        },

        xhr: function(){
            return (this.get('x-requested-with') || '').toLowerCase() === 'xmlhttprequest';
        },

        ua: function(){
            return this.get('user-agent');
        },

        originalUrl: function(){
            return (this.connection.encrypted ? 'https://' : 'http://') + this.headers.host + this.url;
        },

        query: function(){
            return this.search ? utils.parseObject(qs.parse(this.search.replace('?', ''))) : {};
        }
    },

    methods: {

        is: function(types){
            var arr = types;
            if (!Array.isArray(types)) {
                arr = new Array(arguments.length);
                for (var i = 0; i < arr.length; i++) {
                    arr[i] = arguments[i];
                }
            }
            return typeis(this, arr);
        },

        get: function(header){
            return this.headers[header.toLowerCase()];
        }
    }
};


const parsedUrlProps = ['protocol', 'slashes', 'auth', 'host', 'port', 'hostname', 'hash', 'search', 'pathname', 'path', 'href']
    .forEach(function(prop){
        defineGetter(proto, prop, function(){
            return parseurl.original(this)[prop];
        });
    });

defineGetter(proto, 'ip', Request.properties.ip);
defineGetter(proto, 'ips', Request.properties.ips);
defineGetter(proto, 'xhr', Request.properties.xhr);
defineGetter(proto, 'ua', Request.properties.ua);
defineGetter(proto, 'originalUrl', Request.properties.originalUrl);
defineGetter(proto, 'query', Request.properties.query);


// proto.query = Object.create(null);
// consider killing these and handling them in the middleware
proto.body = Object.create(null);
proto.params = Object.create(null);

proto.is = Request.methods.is;
proto.get = Request.methods.get;


module.exports = proto;
