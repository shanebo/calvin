const clone = require('clone');

// returns the type of whatever is passed in
const getType = item => ({}).toString.call(item).match(/\s([a-zA-Z]+)/)[1].toLowerCase();

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

// turns empty strings and 'true' or 'false' to booleans in objects and arrays
function parseValue(val) {
  if (typeof val == 'undefined' || val == '') {
    return null;
  } else if (val === 'false' || val === 'true') {
    return parseBoolean(val);
  } else if (Array.isArray(val)) {
    return parseArray(val)
  } else if (val.constructor === Object) {
    return parseObject(val);
  } else {
    return val;
  }
}

function parseArray(arr) {
  let result = [];
  for (var i = 0; i < arr.length; i++) {
    result[i] = parseValue(arr[i]);
  }
  return result;
}

function parseBoolean(val) {
  return val === 'true';
}

function parseObject(obj) {
  let result = {};
  var key, val;
  for (key in obj) {
    val = parseValue(obj[key]);
    result[key] = val;
  }
  return result;
}

const cleanWhitespace = str => str.replace(/\s+/g, ' ').trim();

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

const camelCase = str => str.replace(/-([a-z])/g, g => g[1].toUpperCase());

const getCallsite = layer => layer
  .getFileName()
  .replace(/\/[^\/]+$/, '')
  .replace(process.cwd(), '');

const production = (process.env.NODE_ENV === 'production');

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
exports.production = production;
exports.getCallsite = getCallsite;
exports.camelCase = camelCase;
exports.defineProperty = defineProperty;
exports.extendProto = extendProto;
exports.cleanWhitespace = cleanWhitespace;
exports.merge = merge;
exports.parseObject = parseObject;
