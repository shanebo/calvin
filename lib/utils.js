

var fs = require('fs');


var parseValue = function(val){
    if (typeof val == 'undefined' || val == '')         return null
    else if (val === 'false' || val === 'true')         return parseBoolean(val)
    else if (Array.isArray(val))                        return parseArray(val)
    else if (val.constructor === Object)                return parseObject(val)
    else                                                return val;
}

var parseArray = function(arr){
    var result = [];
    for (var i = 0; i < arr.length; i++) {
        result[i] = parseValue(arr[i]);
    }
    return result;
}

var parseBoolean = function(val){
    return val === 'true';
}

var parseObject = function(obj){
    var result = {};
    var key, val;
    for (key in obj) {
        val = parseValue(obj[key]);
        result[key] = val;
    }
    return result;
}


exports.parseObject = parseObject;




exports.exists = function(path){
    var fn = typeof fs.accessSync === 'function' ? fs.accessSync : fs.statSync;

    try {
        fn(path);
        return true;
    } catch (err) {
        return false;
    }
};
