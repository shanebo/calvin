const http = require('http');
const proto = http.IncomingMessage.prototype;
const typeis = require('type-is');
const parseurl = require('parseurl');
const qs = require('qs');
const { defineProperty, extendProto } = require('./utils');

const Request = {

  properties: {

    query() {
      return qs.parse(parseurl(this).query);
    },

    ip() {
      return this.ips[0] || this.connection.remoteAddress;
    },

    ips() {
      return (this.get('x-forwarded-for') || '').split(',');
    },

    xhr() {
      return (this.get('x-requested-with') || '').toLowerCase() === 'xmlhttprequest';
    },

    ua() {
      return this.get('user-agent');
    },

    protocol() {
      return this.connection.encrypted
        ? 'https'
        : 'http';
    },

    secure() {
      return this.protocol === 'https';
    },

    originalUrl() {
      return `${this.protocol}://${this.headers.host}${this.url}`;
    }
  },

  methods: {

    is(types) {
      let arr = types;
      if (!Array.isArray(types)) {
        arr = new Array(arguments.length);
        for (var i = 0; i < arr.length; i++) {
          arr[i] = arguments[i];
        }
      }
      return typeis(this, arr);
    },

    get(header) {
      return this.headers[header.toLowerCase()];
    }
  }
};

[
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
  defineProperty(proto, prop, function() {
    return parseurl(this)[prop];
  });
});

extendProto(proto, Request);

module.exports = proto;
