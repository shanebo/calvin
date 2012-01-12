
    var url = require('url'),
        qs  = require('querystring');


	var Parser = new Class({
	
		initialize: function() {
			console.log('--> Initializing Parser middleware...');
		},
	
		handler: function(request, response, next) {
			var parsed = url.parse(request.url, true);
			
			request.query  = parsed.query;
			request.search = parsed.search;
			request.hash   = parsed.hash;
			
			request.param = function(key, value) {
				if (value !== undefined) {
					this.query[key] = value;
					return this;
				} else {
					return this.query[key];
				}
			};
			
			if (request.method == 'POST') {
				var body = '';
			
				request.on('data', function (data) {
					body += data;
					this.body = body;
				});
			
				request.on('end', function() {
					request.query = qs.parse(body);
					next();
				});
			} else {
				next();
			}
		}
	
	});
	

	module.exports = Parser;

