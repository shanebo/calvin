

var Logger = function(options){
	console.log('Initializing Logger middleware...');
}


Logger.prototype = {

	logger: function(request, response){
		var duration = new Date - request.started;
		var started = request.started.format('%m/%d/%Y %l:%M:%S%p %z').clean();

		if (request.calvin.route) {
			console.log('\n');
			var log = [request.method, '"' + request.url + '"', response.statusCode, duration + 'ms', started].join(' ');
			console.log(log);
		} else {
			var log = [request.method, '"' + request.url + '"', response.statusCode, request.calvin.asset, duration + 'ms', started].join(' ');
			console.log(log);
		}
	},

	handler: function(request, response, next){
		request.on('end', this.logger.bind(this, request, response));
		next();
	}

};


module.exports = function(options){
	return new Logger(options);
}