

var url = require('url');
var typeis = require('type-is');


var Request = {

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

};


exports.extend = function(request, response){
    var protocol = request.connection.encrypted ? 'https://' : 'http://';
    var fullUrl = protocol + request.headers.host + request.url;
    var parsed = url.parse(fullUrl);

    for (var prop in Request) {
        request[prop] = Request[prop];
    }

    for (var prop in parsed) {
        if (parsed.hasOwnProperty(prop)) {
            request[prop] = parsed[prop];
        }
    }

    request.calvin = {};
    request.started = new Date;
    request.query = {};
    request.params = {};
    request.xhr = request.headers.hasOwnProperty('x-requested-with') && request.headers['x-requested-with'].toLowerCase() === 'xmlhttprequest';
};
