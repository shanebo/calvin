

'use strict';


const fs = require('fs');
const http = require('http');


// checks if a path exists
const exists = function(path) {
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
const getType = function(item){
    return ({}).toString.call(item).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
}




// Array & Object cloning, Object merging and appending
// var a = { foo: 'bar' };
// var b = { bar: 'baz' };
// console.log(mergeObjects(a, b));

const cloneOf = function(item){
    switch (getType(item)){
        case 'array': return cloneArray(item);
        case 'object': return cloneObject(item);
        default: return item;
    }
}

const cloneArray = function(arr){
    var i = arr.length, clone = new Array(i);
    while (i--) clone[i] = cloneOf(arr[i]);
    return clone;
}

const mergeOne = function(source, key, current){
    switch (getType(current)){
        case 'object':
            if (getType(source[key]) == 'object') mergeObjects(source[key], current);
            else source[key] = cloneObject(current);
            break;
        case 'array': source[key] = cloneArray(current); break;
        default: source[key] = current;
    }
    return source;
}

const mergeObjects = function(source, k, v){
    if (getType(k) == 'string') return mergeOne(source, k, v);
    for (var i = 1, l = arguments.length; i < l; i++){
        var obj = arguments[i];
        for (var key in obj) mergeOne(source, key, obj[key]);
    }
    return source;
}

const cloneObject = function(obj){
    var clone = {};
    for (var key in obj) clone[key] = cloneOf(obj[key]);
    return clone;
}




// turns item into an array and flattens array
const toFlatArray = function(item){
    return [].concat.apply([], [item]);
}




// sets arguments for stringify
const stringify = function(value, replacer, spaces) {
    // v8 checks arguments.length for optimizing simple call
    // https://bugs.chromium.org/p/v8/issues/detail?id=4730
    return replacer || spaces ?
        JSON.stringify(value, replacer, spaces) :
        JSON.stringify(value);
}




// turns empty strings and 'true' or 'false' to booleans in objects and arrays
const parseValue = function(val) {
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

const parseArray = function(arr) {
    let result = [];
    for (var i = 0; i < arr.length; i++) {
        result[i] = parseValue(arr[i]);
    }
    return result;
}

const parseBoolean = function(val) {
    return val === 'true';
}

const parseObject = function(obj) {
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
const getParamKeys = function(route, regex) {
    var matches = route.match(regex);
    if (matches) {
        matches.shift();
        return matches.map(item => item.replace(':', ''));
    }
    return [];
}




// removes beard html extra whitespace
const removeExtraHtmlWhitespace = function(str){
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




// patches in includes method if it doesn't exist
if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement /*, fromIndex*/ ) {
        'use strict';
        if (this == null) {
            throw new TypeError('Array.prototype.includes called on null or undefined');
        }

        var O = Object(this);
        var len = parseInt(O.length, 10) || 0;
        if (len === 0) {
            return false;
        }
        var n = parseInt(arguments[1], 10) || 0;
        var k;
        if (n >= 0) {
            k = n;
        } else {
            k = len + n;
            if (k < 0) {
                k = 0;
            }
        }
        var currentElement;
        while (k < len) {
            currentElement = O[k];
            if (searchElement === currentElement ||
                (searchElement !== searchElement && currentElement !== currentElement)) { // NaN !== NaN
                return true;
            }
            k++;
        }
        return false;
    };
}


exports.exists = exists;
exports.getType = getType;
exports.methods = methods;
exports.getParamKeys = getParamKeys;
exports.removeExtraHtmlWhitespace = removeExtraHtmlWhitespace;
exports.mergeObjects = mergeObjects;
exports.cloneObject = cloneObject;
exports.toFlatArray = toFlatArray;
exports.stringify = stringify;
exports.parseObject = parseObject;
