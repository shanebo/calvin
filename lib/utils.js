

'use strict';


const fs = require('fs');
const http = require('http');
const clone = require('clone');
const less = require('less');
const path = require('path');
const join = path.join;
const extname = path.extname;
const resolve = path.resolve;



// checks if a path exists
function exists(path) {
    var fn = typeof fs.accessSync === 'function' ? fs.accessSync : fs.statSync;

    try {
        fn(path);
        return true;

    } catch (err) {
        return false;
    }
}




// returns the type of whatever is passed in
// console.log(getType([]));
// console.log(getType({}));
// console.log(getType('{}'));
// console.log(getType(12));
function getType(item) {
    return ({}).toString.call(item).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
}




// Array & Object cloning, Object merging and appending
// var a = { foo: 'bar' };
// var b = { bar: 'baz' };
// console.log(merge(a, b));

function mergeOne(source, key, current) {
    switch (getType(current)){
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
    for (var i = 1, l = arguments.length; i < l; i++){
        var obj = arguments[i];
        for (var key in obj) mergeOne(source, key, obj[key]);
    }
    return source;
}



function toArray(item) {
    return !Array.isArray(item)
        ? [item]
        : item;
}

// turns item into an array and flattens array
function toFlatArray(item) {
    return [].concat.apply([], toArray(item));
}




// sets arguments for stringify
function stringify(value, replacer, spaces) {
    // v8 checks arguments.length for optimizing simple call
    // https://bugs.chromium.org/p/v8/issues/detail?id=4730
    return replacer || spaces ?
        JSON.stringify(value, replacer, spaces) :
        JSON.stringify(value);
}




// turns empty strings and 'true' or 'false' to booleans in objects and arrays
function parseValue(val) {
    if (typeof val == 'undefined' || val == '')
        return null

    else if (val === 'false' || val === 'true')
        return parseBoolean(val)

    else if (Array.isArray(val))
        return parseArray(val)

    else if (val.constructor === Object)
        return parseObject(val)

    else
        return val;
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




// http methods that calvin supports
const methods = [
    'get',
    'post',
    'put',
    'patch',
    'delete'
];

// exports.methods = http.METHODS.map(function(method){
//     return method.toLowerCase();
// });




// returns params array
function getParamKeys(route, regex) {
    var matches = route.match(regex);
    if (matches) {
        matches.shift();
        return matches.map(item => item.replace(':', ''));
    }
    return [];
}




// removes beard html extra whitespace
function removeExtraHtmlWhitespace(str) {
    // remove newline / carriage return
    // remove whitespace (space and tabs) before tags
    // remove whitespace between tags
    // remove whitespace after tags

    //  almost working
    // return str.replace(/\s+/g, ' ')
    //     .replace(/}\s+</g,'}<')
    //     .replace(/>\s+{/g,'>{')
    //     .replace(/}\s+{/g,'}{')
    //     .replace(/>\s+</g,'><')
    //     .trim();

    return str
        .replace(/\s+/g, ' ')
        // .replace(/\}\s+\</g,'}<')        // removes space between curlys and tags
        // .replace(/\>\s+\{/g,'>{')        // removes space between curlys and tags
        // .replace(/\}\s+\{/g,'}{')        // removes space between curlys
        // .replace(/<!--[\s\S]*?-->/g,'')  // removes comments
        // .replace(/>\s+</g, '><')
        .trim();
}



















// https://tc39.github.io/ecma262/#sec-array.prototype.includes
if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, 'includes', {
    value: function(searchElement, fromIndex) {

      // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If len is 0, return false.
      if (len === 0) {
        return false;
      }

      // 4. Let n be ? ToInteger(fromIndex).
      //    (If fromIndex is undefined, this step produces the value 0.)
      var n = fromIndex | 0;

      // 5. If n ≥ 0, then
      //  a. Let k be n.
      // 6. Else n < 0,
      //  a. Let k be len + n.
      //  b. If k < 0, let k be 0.
      var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

      // 7. Repeat, while k < len
      while (k < len) {
        // a. Let elementK be the result of ? Get(O, ! ToString(k)).
        // b. If SameValueZero(searchElement, elementK) is true, return true.
        // c. Increase k by 1.
        // NOTE: === provides the correct "SameValueZero" comparison needed here.
        if (o[k] === searchElement) {
          return true;
        }
        k++;
      }

      // 8. Return false
      return false;
    }
  });
}




















// function arrayToIndex(arr, dirPath) {
//     let obj = {};
//     arr.forEach(function(item){
//         let key = item.replace(dirPath, '');
//         obj[key] = true;
//     });
//     return obj;
// }


// function toDirectoryMap(dir) {
//     let files = [];
//     let directories = [];
//     toPathArray(dir).forEach(function(p){
//         extname(p) === ''
//             ? directories.push(p)
//             : files.push(p);
//     });
//     return {
//         directories: directories,
//         files: files
//     };
// }


function getFiles(dir) {
    let paths = [];
    fs.readdirSync(dir).forEach(function(file) {
        if (file.charAt(0) === '.') return;
        let fullPath = resolve(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            paths = paths.concat(getFiles(fullPath));
        } else {
            paths.push(fullPath);
        }
    });
    return paths;
}



// directoryMap: function(dir) {
//     let files = [];
//     let directories = [];
//     walkDirSync(dir).forEach(function(p){
//         path.extname(p) === ''
//             ? directories.push(p)
//             : files.push(p);
//     });
//     return {
//         directories: directories,
//         files: files
//     };
// },

function directoryToArray(dir) {
    let paths = [];
    fs.readdirSync(dir).forEach(function(file) {
        if (file.charAt(0) === '.') return;
        let fullPath = resolve(dir, file);
        paths.push(fullPath);
        if (fs.statSync(fullPath).isDirectory()) {
            paths = paths.concat(directoryToArray(fullPath));
        }
    });
    return paths;
}

function directoryToFilesAndDirectoriesMap(dir) {
    let files = [];
    let directories = [];
    directoryToArray(dir).forEach(function(p){
        extname(p) === ''
            ? directories.push(p)
            : files.push(p);
    });
    return {
        directories: directories,
        files: files
    };
}




function arrayToRegex(arr) {
    return new RegExp(arr.join('|'), 'gi');
}

function toPathArray(dir) {
    let paths = [];
    fs.readdirSync(dir).forEach(function(file) {
        if (file.charAt(0) === '.') return;
        let fullPath = resolve(dir, file);
        paths.push(fullPath);
        if (fs.statSync(fullPath).isDirectory()) {
            paths = paths.concat(toPathArray(fullPath));
        }
    });
    return paths;
}


exports.getFiles = getFiles;
exports.directoryToArray = directoryToArray;
exports.directoryToFilesAndDirectoriesMap = directoryToFilesAndDirectoriesMap;
exports.arrayToRegex = arrayToRegex;
exports.toPathArray = toPathArray;






function defineProperty(obj, name, descriptor) {
    descriptor = getType(descriptor) == 'object'
        ? descriptor
        : { get: descriptor };
    Object.defineProperty(obj, name, descriptor);
};

// function defineProperty(obj, name, getter, setter) {
//     let descriptor = {};
//     if (getter) descriptor.get = getter;
//     if (setter) descriptor.set = setter;
//     Object.defineProperty(obj, name, descriptor);
// };

function extendProto(proto, obj) {
    Object.keys(obj).forEach(function(type){
        Object.keys(obj[type]).forEach(function(prop){
            if (type === 'properties') {
                defineProperty(proto, prop, obj[type][prop]);
            } else {
                proto[prop] = obj[type][prop];
            }
        });
    });
}

exports.defineProperty = defineProperty;
exports.extendProto = extendProto;











exports.less = less;

exports.exists = exists;
exports.getType = getType;
exports.methods = methods;
exports.getParamKeys = getParamKeys;
exports.removeExtraHtmlWhitespace = removeExtraHtmlWhitespace;
exports.merge = merge;
exports.toFlatArray = toFlatArray;
exports.stringify = stringify;
exports.parseObject = parseObject;
