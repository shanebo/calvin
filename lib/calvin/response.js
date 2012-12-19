

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

	error: function(err){
		this.writeHead(500, { 'Content-Type': 'text/html' });
		this.end(this.partial('/error.html', { 'error': err, dump: 'hello world' }));
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
			this._serve(view);
		} else {
			data.view = view.body;
			layout = Object.clone(this.cache['/views' + layout]);
			layout.body = this.engines[this.engine](layout.body, data);
			this._serve(layout);
		}
	},

	redirect: function(url, status){
		this.writeHead(status || 302, { 'Location': url, 'Pragma': 'no-cache' });
		this.end();
	}

};


module.exports = Response;