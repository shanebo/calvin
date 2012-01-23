

var fs 			=	require('fs');
var mime 		= 	require('mime');
var Beard 		=	require('beard');
var Mustache 	=	require('mustache');


var Controller = new Class({

	initialize: function(request, response, app){
		this.request = request;
		this.response = response;
		this.engine = app.engine;
		this.cache = app.cache;
	},

	error: function(err){
		this.response.writeHead(500, { 'Content-Type': 'text/html' });
		this.response.end(this.partial('/error.html', {'error': err, dump: 'hello world'}));
	},

	setFlash: function(message){
		this.request.session.flash = message;
	},

	flash: function(){
		var flash = this.request.session.flash;
		this.request.session.flash = '';
		return flash;
	},

	isAjax: function(){
		var headers = this.request.headers;
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
		this.response.writeHead(200, {
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

		this.response.end(asset.body);
	},

	partial: function(view, data){
		view = Object.clone(this.cache['/views' + view]);
		return this.engines[this.engine](view.body, data);
	},

	render: function(view, layout, data){
		this.request.calvin.view = view;
		this.request.calvin.layout = layout;
		this.request.calvin.engine = this.engine;
		this.request.calvin.dump = data;

		view = Object.clone(this.cache['/views' + view]);
		view.body = this.engines[this.engine](view.body, data);

		if (this.isAjax() || !layout) {
			this.serve(view);
		} else {
			data.view = view.body;
			layout = Object.clone(this.cache['/views' + layout]);
			layout.body = this.engines[this.engine](layout.body, data);
			this.serve(layout);
		}
	},

	redirect: function(url){
		this.response.writeHead(302, { 'Location': url, 'Pragma': 'no-cache' });
		this.response.end();
	}

});


module.exports = Controller;

