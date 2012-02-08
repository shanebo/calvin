

var cookies	= require('cookies');
var uuid	= require('node-uuid');


var Sessions = new Class({

	Implements: Options,
	
	options: {
		expires: 31556952000,
		session: 'calvin-session',
		cookie: {
			path: '/',
			expires: new Date(+new Date + 31556952000),
			httpOnly: true
		}
	},

	store: {},

	initialize: function(options){
		this.setOptions(options);
		console.log('--> Initializing Sessions middleware...');
	},

	freshCookie: function(request, response){
		return {
			path:		request.url,
			expires:	new Date(+new Date + this.options.expires),
			httpOnly:	true
		};
	},

	handler: function(request, response, next){
		var name = this.options.session;
		var jar = new cookies(request, response, this.options.keys);
		var id = jar.get(name);

		if (id === undefined) {
			id = uuid();
			jar.set(name, id, this.options.cookie);
		}

		response._session = {
			name:	name,
			id:		id
		}

		response.session = this.get(id) || {};
		request.session = response.session;
		request.on('end', function(event, data){
			console.log('\nRequest ended');
			this.update(response._session.id, request.session);
		}.bind(this));

		if (!request.session.flash) request.session.flash = '';
		if (next) next();
	},

	get: function(id){
		console.log('\nGet session');
		return this.store[id];
	},

	update: function(id, data){
		console.log('\nUpdating session');
		this.store[id] = data;
		console.log(this.store);
	},

	destroy: function(id, request, response){
		console.log('\nDestroying session');
		delete this.store[id];
	}

});


module.exports = Sessions;

