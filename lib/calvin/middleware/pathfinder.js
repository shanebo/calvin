

	var Pathfinder = new Class({
	
		initialize: function(section, server){
			console.log('--> Initializing Pathfinder middleware...');

			if (!section) 	throw new Error('Pathfinder section required');
			if (!server) 	throw new Error('Pathfinder server required');

			this.section = section;
			this.server = server;
		},

		handler: function(request, response, next){
			if (!request.url) return next();

			var section = request.url.split('/')[0];

			if (section === this.section) {
				this.server.emit('request', request, response, next);
			} else {
				if (next) next();
			}
		}
	
	});
	
	
	module.exports = Pathfinder;
	
