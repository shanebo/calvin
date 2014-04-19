

var cookies = require('cookies');
var fs = require('fs');


var Sessions = function(options){
	console.log('Initializing Sessions middleware...');
	for (var prop in options) this.options[prop] = options[prop];
}


Sessions.prototype = {

	options: {
		expires: 31556952000,
		session: 'calvin-session',
		cookie: {
//			domain: '',
			path: '/',
			expires: new Date(+new Date + 31556952000),
			httpOnly: true
		}
	},

	store: {},

	uuid: function(){
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c){
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});
	},

	handler: function(request, response, next){
		var url = request.url.split('?')[0];

		var pubs = this.options.publics;

		if (url !== '/' && pubs && (pubs.directories.test(url) || pubs.files.test(url))) {
			// ignore cookies on public asset paths
			next();
			return;
		}

		var name = this.options.session;
		var jar = new cookies(request, response, this.options.keys);
		var id = jar.get(name);

		if (id === undefined) {
			id = this.uuid();
			jar.set(name, id, this.options.cookie);
		}

		response._session = {
			name: name,
			id: id
		}

		response.session = this.get(id) || {};
		request.session = response.session;
		request.on('end', function(event, data){
			this.update(response._session.id, request.session);
		}.bind(this));
		request.setFlash = function(message){
			request.session.flash = message;
		}
		request.flash = function(){
			var flash = request.session.flash;
			request.session.flash = '';
			return flash;
		}
		if (!request.session.flash) request.session.flash = '';
		if (next) next();
	},

	get: function(id){
		return this.store[id];
	},

	update: function(id, data){
		this.store[id] = data;
	},

	destroy: function(id, request, response){
		delete this.store[id];
	}

};


module.exports = function(options){
	return new Sessions(options);
}