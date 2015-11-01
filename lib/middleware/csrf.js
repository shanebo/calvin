

var crypto = require('crypto');


var CSRF = function(settings){
	console.log('Initializing CSRF middleware...');
}


CSRF.prototype = {

	handler: function(request, response, next){
		var session = request.session;

		var tokenMatches = function(){
			var headers = ['csrf-token', 'xsrf-token', 'x-csrf-token', 'x-xsrf-token'];
			var matchesHeader = headers.some(function(header){
				return request.headers[header] == session.csrf;
			});
			return request.body.csrf == session.csrf || matchesHeader
		}

		request.csrfToken = function(reset){
			var len = 32;
			var token = crypto.randomBytes(Math.ceil(len * 3 / 4)).toString('base64').slice(0, len);
			session.csrf = reset ? token : (session.csrf || token);
			return session.csrf;
		}

		if (/^(GET|HEAD|OPTIONS|TRACE)$/.test(request.method)) {
			next();

		} else if (tokenMatches()) {
			next();

		} else {
			request.csrfToken(true);
			response.send(401);
		}

	}

}


module.exports = function(settings){
	return new CSRF(settings);
}
