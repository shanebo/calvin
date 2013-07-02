

var Logger = function(options){
	console.log('--> Initializing Logger middleware...');
};


Logger.prototype = {

	logger: function(request, response){
		console.log('\n');

		var duration = new Date - request.started;
		console.log(request.method + ' ' + (request.calvin.hasOwnProperty('asset') ? request.calvin.asset : '') + ' "' + request.url + '" took ' + duration + 'ms');

		if (request.calvin.hasOwnProperty('route')) {
			console.log(' --> route: ' + request.calvin.route.route);
			console.log(' --> params: ' + JSON.stringify(request.calvin.params));

			if (request.calvin.hasOwnProperty('view')) {
				console.log(' --> render:');
				console.log('  --> view: ' + request.calvin.view);
				console.log('  --> layout: ' + request.calvin.layout);
				console.log('  --> engine: ' + request.calvin.engine);
			}
		}
	},
	
	handler: function(request, response, next){
		request.calvin = {};
		request.started = new Date;
		request.on('end', this.logger.bind(this, request, response));
		next();
	}

};


module.exports = Logger;