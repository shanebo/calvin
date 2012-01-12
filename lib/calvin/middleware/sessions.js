

	var cookies	= require('cookies');
	var uuid	= require('node-uuid');


	var Session = new Class({
	
		Implements: Options,
		
		options: {
			expires: 31556952000,
			session: 'tad-session',
			cookie: {
				path: '/',
				expires: new Date(+new Date + 31556952000),
				httpOnly: true
			}
		},

		initialize: function(id, sessions) {
			console.log('--> Initializing a Session...');
			this._id = id;
			this._sessions = sessions;
		},
	
		freshCookie: function(request, response, options) {
			return {
				expires: new Date(+new Date + this.options.expires),
				httpOnly: true
			};
		},

		destroy: function() {
			console.log('in session destroy');
			this._sessions.destroy(this._id);
		}
	
	});


	var Sessions = new Class({
	
		Implements: Options,
		
		options: {
			expires: 31556952000,
			session: 'tad-session',
			cookie: {
				path: '/',
				expires: new Date(+new Date + 31556952000),
				httpOnly: true
			}
		},

		store: {},
	
		initialize: function(options) {
			this.setOptions(options);
			console.log('--> Initializing Sessions middleware...');
		},
	
		freshCookie: function(request, response) {
			return {
				path:		request.url,
				expires:	new Date(+new Date + this.options.expires),
				httpOnly:	true
			};
		},

		handler: function(request, response, next) {
			console.log('In Session Handler');
	        var name = this.options.session;
	        var jar = new cookies(request, response, this.options.keys);
	        var id = jar.get(name);
	
	        if (id === undefined) {
	            id = uuid();
	            jar.set(name, id, this.options.cookie);
//	            jar.set(name, id, this.freshCookie(request, response));
	        }
	
			response._sessionData = {
			    store:	this.store,
			    name:	name,
				id:		id
			}

			response.session = this.get(id) || new Session(id, this);
//			response.session = this.get(id) || {};
			request.session  = response.session;
			if (!request.session.flash) request.session.flash = '';
			
			request.on('end', function(event, data) {
				console.log('\n\n\nrequest ended!\n\n\n');
				console.log(this.store);
				console.log(request);
				this.update(response._sessionData.id, request.session);
			}.bind(this));

			next();
		},
	
		update: function(id, data) {
			console.log('\n\n\nUpdating session!');
			this.store[id] = data;
			console.log(this.store);
		},
	
		get: function(id) {
			return this.store[id];
		},

		destroy: function(id, req, res) {
			console.log('in sessions destroy');
			delete this.store[id];
		}
	
	});
	

	module.exports = Sessions;

