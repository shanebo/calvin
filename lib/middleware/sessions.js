

var cookies = require('cookies');


var Sessions = function(settings){
	console.log('Initializing Sessions middleware...');
	for (var prop in settings) this.settings[prop] = settings[prop];
}


Sessions.prototype = {

	settings: {
		expires: 31556952000,
		session: 'calvin-session',
		cookie: {
			path: '/',
			expires: new Date(+new Date + 31556952000),
			httpOnly: true
			// domain: string,
			// maxAge: number in milliseconds,
			// secure: boolean,
			// secureProxy: boolean,
			// signed: boolean,
			// overwrite: boolean
		}
	},

	store: {},

	uuid: function(){
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c){
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});
	},

	get: function(id){
		return this.store[id];
	},

	update: function(id, data){
		this.store[id] = data;
	},

	destroy: function(id, request, response){
		delete this.store[id];
	},

	handler: function(request, response, next){
		var pubs = this.settings.publics;

		if (request.pathname !== '/' && pubs && pubs.files.test(request.pathname)) {
			next();
			return;
		}

		var jar = new cookies(request, response);
		var name = this.settings.session;
		var id = jar.get(name);

		if (id === undefined) {
			id = this.uuid();
			jar.set(name, id, this.settings.cookie);
		}

		request.session = this.get(id) || {};

		request.setFlash = function(message){
			request.session.flash = message;
		}

		request.flash = function(){
			var flash = request.session.flash;
			request.session.flash = '';
			return flash;
		}

		request.on('end', function(event, data){
			this.update(id, request.session);
		}.bind(this));

		if (!request.session.flash) request.session.flash = '';

		next();
	}

};


module.exports = function(settings){
	return new Sessions(settings);
}
