

var	qs = require('querystring');


var Parser = function(){
	console.log('Initializing Parser middleware...');
}


Parser.prototype = {

	handler: function(request, response, next){
		if (request.method.toLowerCase() == 'post') {
			var body = '';
			
			request.on('data', function(data){
				body += data;
			});

			request.on('end', function(){
				request.body = qs.parse(body);
				next();
			});
		} else if (next) {
			next();
		}
	}

};


module.exports = function(){
	return new Parser();
}