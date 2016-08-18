

'use strict';


const fs = require('fs');
const http = require('http');


const stringify = function(value, replacer, spaces) {
    // v8 checks arguments.length for optimizing simple call
    // https://bugs.chromium.org/p/v8/issues/detail?id=4730
    return replacer || spaces ?
        JSON.stringify(value, replacer, spaces) :
        JSON.stringify(value);
}


exports.stringify = stringify;



var parseValue = function(val) {
    if (typeof val == 'undefined' || val == '') return null
    else if (val === 'false' || val === 'true') return parseBoolean(val)
    else if (Array.isArray(val)) return parseArray(val)
    else if (val.constructor === Object) return parseObject(val)
    else return val;
}

var parseArray = function(arr) {
    var result = [];
    for (var i = 0; i < arr.length; i++) {
        result[i] = parseValue(arr[i]);
    }
    return result;
}

var parseBoolean = function(val) {
    return val === 'true';
}

var parseObject = function(obj) {
    var result = {};
    var key, val;
    for (key in obj) {
        val = parseValue(obj[key]);
        result[key] = val;
    }
    return result;
}


exports.parseObject = parseObject;




exports.exists = function(path) {
    var fn = typeof fs.accessSync === 'function' ? fs.accessSync : fs.statSync;

    try {
        fn(path);
        return true;
    } catch (err) {
        return false;
    }
};





exports.methods = [
    'get',
    'post',
    'put',
    'delete'
];

// exports.methods = http.METHODS.map(function(method){
//     return method.toLowerCase();
// });



// exports.getParamKeys = function(route, regex){
//     var params = route.match(regex);
//     params.shift();
//     params = params.map(function(item, index){
//         return item.replace(':', '');
//     });
//     return params;
// }

exports.getParamKeys = function(route, regex) {
    var params = route.match(regex);
    if (params) {
        params.shift();
        params = params.map(function(item, index) {
            return item.replace(':', '');
        });
        return params;
    }
    return [];
}



exports.removeExtraHtmlWhitespace = function(str){
    // return str.replace(/\s+/g, ' ').trim();

    // remove newline / carriage return
    // remove whitespace (space and tabs) before tags
    // remove whitespace between tags
    // remove whitespace after tags

    // return str.replace(/\n/g, '')
    //     .replace(/[\t ]+\</g, '<')
    //     .replace(/\>[\t ]+\</g, '><')
    //     .replace(/\>[\t ]+$/g, '>');

    // path: /Users/Shane/Code/ligonier/node/renewingyourmind.org/app/../views/_footer.html
    // body.length before: 742
    // body.length after: 587

    // path: /Users/Shane/Code/ligonier/node/renewingyourmind.org/app/../views/_footer.html
    // body.length before: 742
    // body.length after: 549

    return str.replace(/\s+/g, ' ')
        .replace(/}\s+</g,'}<')
        .replace(/>\s+{/g,'>{')
        .replace(/}\s+{/g,'}{')
        .replace(/>\s+</g,'><')
        .trim();
    // return str.replace(/\s+/g, ' ').replace(/>\s+</g,'><').trim();
}



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
