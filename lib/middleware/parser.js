

var	qs = require('qs');


var Parser = function(){
	console.log('Initializing Parser middleware...');
}


Parser.prototype = {

	handler: function(request, response, next){
		var method = request.method.toLowerCase();

		if (method == 'post' || method == 'put') {
			var body = '';
			
			request.on('data', function(data){
				body += data;
			});

			request.on('end', function(){
				request.body = parseObject(qs.parse(body));
				next();
			});

		} else {
			if (request.search) {
				request.query = parseObject(qs.parse(request.search.replace('?', '')));
			}
			next();
		}
	}

};


var parseValue = function(val){
	if (typeof val == 'undefined' || val == '') 		return null
	else if (val === 'false' || val === 'true')			return parseBoolean(val)
	else if (Array.isArray(val)) 						return parseArray(val)
	else if (val.constructor === Object) 				return parseObject(val)
	else 												return val;
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


module.exports = function(){
	return new Parser();
}