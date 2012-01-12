

var fs 			=	require('fs');
var mime 		= 	require('mime');

var Beard 		=	require('beard');
var Mustache 	=	require('./../deps/mustache/mustache');
var helpers 	=	require('./../deps/mustache/helpers');


var Controller = new Class({

	helpers: helpers,

	initialize: function(request, response, app){
		this.req = request;
		this.res = response;
		this.db = app.db;
		this.engine = app.engine || 'mustache';
		this.cache = app.cache;
	},

	error: function(err){
		console.log(err);

		var view = {
			e: this.req.e
		}
		this.render('error.html', false, view);
	},

	setFlash: function(message){
		this.req.session.flash = message;
	},

	flash: function(){
		var flash = this.req.session.flash;
		this.req.session.flash = '';
		return flash;
	},

	isAjax: function(){
		var headers = this.req.headers;
		return headers.hasOwnProperty('x-requested-with') && headers['x-requested-with'].toLowerCase() === 'xmlhttprequest';
	},

	engines: {
		
		mustache: function(template, data){
			return Mustache.to_html(template, data);
		},

		beard: function(template, data){
			return Beard.render(template, data);
		}
	
	},

	serve: function(asset){

		this.res.writeHead(200, {
//			'Accept-Encoding': 'compress, gzip',
//			'Content-Encoding': 'gzip',
			'Content-Type': asset['Content-Type'],
			'Content-Length': new Buffer(asset.body).length,
//			'Content-Length': asset['Content-Type'] == 'text/html' ? new Buffer(asset.body).length : asset['Content-Length'],
			'Date': new Date().toUTCString(),
			'Last-Modified': asset['Last-Modified'],
			'Cache-Control': asset['Cache-Control'],
//			'Expires': (new Date(new Date().getTime()+63113852000)).toUTCString()
			'Pragma': 'no-cache'
		});

		this.res.end(asset.body);
	},

	partial: function(view, data){
		view = Object.clone(this.cache['/views/' + view]);
		return Mustache.to_html(view.body, data);
	},

//	renderPartial: function(path) {
//		if (this.dev === true) {
//			var file = fs.readFileSync(this.cache.directory + path, 'UTF-8');
//			return Mustache.to_html(file, this);
//		} else {
//			path = path.split('/');
//			path.shift();
//			var store = (path[0] == 'views') ? this.cache[path[0]][path[1]][path[2]] : this.cache[path[0]][path[1]];
//			return this.engines[this.engine](store, this);
//		}
//	},

	render: function(view, layout, data){
		console.log('\nRendering');
		console.log('Serving ' + view);
		console.log('Serving ' + layout);
		console.log('Engine ' + this.engine);

//		data.helpers = helpers;
		view = Object.clone(this.cache['/views/' + view]);
		view.body = this.engines[this.engine](view.body, data);

		if (this.isAjax() || !layout) {
			this.serve(view);
		} else {
			data.view = view.body;
			layout = Object.clone(this.cache['/views/' + layout]);
			layout.body = this.engines[this.engine](layout.body, data);
			this.serve(layout);
		}
	},

	redirect: function(url){
		this.res.writeHead(302, {
			'Location': url,
			'Pragma': 'no-cache'
		});
		this.res.end();
	}

});


module.exports = Controller;

