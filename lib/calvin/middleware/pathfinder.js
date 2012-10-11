

var Pathfinder = new Class({

	initialize: function(section, server){
		console.log('--> Initializing Pathfinder middleware...');
		this.section = section;
		this.multiple = (new RegExp('|').test(section)) ? true : false;
		this.server = server;
	},

	handler: function(request, response, next){
		var section = request.url.split('/')[1];

		if (section === this.section) {
			this.server.emit('request', request, response, next);
		} else if (this.multiple && new RegExp(section).test(this.section)) {
			this.server.emit('request', request, response, next);
		} else if (next) {
			next();
		}
	}

});


module.exports = Pathfinder;

