const clone = require('clone');

// returns the type of whatever is passed in
const getType = (item) => ({}).toString.call(item).match(/\s([a-zA-Z]+)/)[1].toLowerCase();

// Array & Object cloning, Object merging and appending
function mergeOne(source, key, current) {
  switch (getType(current)) {
    case 'object':
      if (getType(source[key]) == 'object') merge(source[key], current);
      else source[key] = clone(current);
      break;
    case 'array': source[key] = clone(current); break;
    default: source[key] = current;
  }
  return source;
}

function merge(source, k, v) {
  if (getType(k) == 'string') return mergeOne(source, k, v);
  for (var i = 1, l = arguments.length; i < l; i++) {
    var obj = arguments[i];
    for (var key in obj) mergeOne(source, key, obj[key]);
  }
  return source;
}

exports.cleanWhitespace = (str) => str.replace(/\s+/g, ' ').trim();

function defineProperty(obj, name, descriptor) {
  descriptor = getType(descriptor) == 'object'
    ? descriptor
    : { get: descriptor };
  Object.defineProperty(obj, name, descriptor);
};

function extendProto(proto, obj) {
  Object.keys(obj).forEach(function (type) {
    Object.keys(obj[type]).forEach(function (prop) {
      if (type === 'properties') {
        defineProperty(proto, prop, obj[type][prop]);
      } else {
        proto[prop] = obj[type][prop];
      }
    });
  });
}

exports.camelCase = (str) => str.replace(/-([a-z])/g, g => g[1].toUpperCase());

exports.getCallsite = (layer) => layer
  .getFileName()
  .replace(/\/[^\/]+$/, '')
  .replace(process.cwd(), '');

const Asset = {
  html(body) {
    return {
      'Cache-Control': 'no-cache',
      'Content-Type': 'text/html',
      'Content-Length': Buffer.byteLength(body, 'utf8'),
      'Date': new Date().toUTCString(),
      'Vary': 'Accept-Encoding'
    };
  }
};

exports.asset = (type, body) => {
  return Asset[type]
    ? Asset[type](body)
    : {};
};

exports.production = process.env.NODE_ENV === 'production';

exports.defineProperty = defineProperty;
exports.extendProto = extendProto;
exports.merge = merge;
