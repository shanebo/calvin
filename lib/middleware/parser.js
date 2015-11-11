

var	qs = require('qs');
var utils = require('../utils');


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
				request.body = utils.parseObject(qs.parse(body));
				next();
			});

		} else if (method == 'get') {
			if (request.search) {
				request.query = utils.parseObject(qs.parse(request.search.replace('?', '')));
			}
			next();

		} else {
			next();
		}
	}

};


module.exports = function(){
	return new Parser();
}
