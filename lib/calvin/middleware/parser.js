

var url = require('url');
var	qs  = require('querystring');


var Parser = function(){
	console.log('--> Initializing Parser middleware...');
};


Parser.prototype = {

	handler: function(request, response, next){
		var parsed = url.parse(request.url, true);
		
		request.query  = parsed.query;
		request.search = parsed.search;
		request.hash   = parsed.hash;

		if (request.method == 'POST') {
			var body = '';
			
			request.on('data', function(data){
				body += data;
//				this.body = body;
			});

			request.on('end', function(){
				request.query = qs.parse(body);
                request.body = body;
				next();
			});
		} else if (next) {
			next();
		}
	}

};


module.exports = Parser;

