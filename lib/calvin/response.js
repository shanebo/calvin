

var Beard		= require('beard');
var Mustache	= require('mustache');


var Response = {

	engine: 'beard',

	engines: {
		mustache: function(template, data){
			return Mustache.to_html(template, data);
		},

		beard: function(template, data){
			return Beard.render(template, data);
		}
	},

	renderStatus: function(status){
		this.writeHead(status, { 'Content-Type': 'text/html' });
		this.end(this.partial('/' + status + '.html', {status: status, url: this.request.url}));
	},

	error: function(err){
		this.writeHead(500, { 'Content-Type': 'text/html' });
		this.end(this.partial('/error.html', { 'error': err }));
	},

	serve: function(asset){

		if (this.request.headers['if-none-match'] && (this.request.headers['if-none-match'] == asset.headers['ETag'])) {
			console.log('!!! Status 304 !!!');
			this.writeHead(304, asset.headers);
			this.end();
			return;
		}

		var gzipped = asset.hasOwnProperty('gzip');
		var now = new Date().toUTCString();

		asset.headers['Date'] = now;

		if (gzipped) {
//		if (asset.headers['Content-Type'] !== 'text/html') asset.headers['Accept-Encoding'] = 'compress, gzip, deflate';
			asset.headers['Content-Encoding'] = 'gzip';
		} else if (asset.headers['Content-Type'] == 'text/html') {
			asset.headers['Content-Length'] = new Buffer(asset.body).length;
			asset.headers['ETag'] = '"' + now + '"';
			asset.headers['Last-Modified'] = '"' + now + '"';
		}

		this.writeHead(200, asset.headers);
		this.end(gzipped ? asset.gzip : asset.body);
	},

	_serve: function(asset){
//		'Content-Encoding': 'gzip',
//		'Pragma': 'no-cache'
		asset.headers['Content-Length'] = new Buffer(asset.body).length;
		asset.headers['Date'] = new Date().toUTCString();
		asset.headers['ETag'] = '"' + new Date().toUTCString() + '"';
		asset.headers['Last-Modified'] = '"' + new Date().toUTCString() + '"';
		this.writeHead(200, asset.headers);
		this.end(asset.body);
	},

	partial: function(view, data){
		view = Object.clone(this.cache['/views' + view]);
		return this.engines[this.engine](view.body, data);
	},

	render: function(view, layout, data){
		view = Object.clone(this.cache['/views' + view]);
		view.body = this.engines[this.engine](view.body, data);

		if (this.request.isAjax() || !layout) {
			this.serve(view);
		} else {
			data.view = view.body;
			layout = Object.clone(this.cache['/views' + layout]);
			layout.body = this.engines[this.engine](layout.body, data);
			this.serve(layout);
		}
	},

	redirect: function(url, status){
		this.writeHead(status || 302, { 'Location': url, 'Pragma': 'no-cache' });
		this.end();
	}

};


module.exports = Response;