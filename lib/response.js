

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

	error: function(err, status, options){

		status = ['403','404','500','502','503'].contains(status) ? status : '500';

		var errors = {
			'403': 'Forbidden Access',
			'404': 'Path Not Found',
			'500': 'Something Went Wrong',
			'502': 'Service Temporarily Overloaded',
			'503': 'Service Unavailable'
		};

		if (options.environment === 'production') {
			options.routes['get']['/' + status].fn(this.request, this);
		} else {
			var view = {
				error: err
			};
	
			if (errors.hasOwnProperty(status)) view.error.message += (' ' + errors[status]);
			
			this.writeHead(status, { 'Content-Type': 'text/html' });
			this.end(this.partial('calvin/error.html', view));
		}
	},

	serve: function(asset){

		if (this.request.headers['if-none-match'] && this.request.headers['if-none-match'] == asset.headers['ETag']) {
			this.writeHead(304, asset.headers);
			this.end();
			return;
		}

		var gzipped = asset.hasOwnProperty('gzip');
		var now = new Date().toUTCString();

		asset.headers['Date'] = now;

		if (gzipped) {
			asset.headers['Content-Encoding'] = 'gzip';
		} else if (asset.headers['Content-Type'] == 'text/html') {
//			asset.headers['Content-Length'] = new Buffer(asset.body).length;
			asset.headers['ETag'] = '"' + now + '"';
			asset.headers['Last-Modified'] = '"' + now + '"';
		}

		this.writeHead(200, asset.headers);
		this.end(gzipped ? asset.gzip : asset.body);
	},

	partial: function(view, data){
		view = Object.clone(this.cache['/views/' + view]);
		return this.engines[this.engine](view.body, data);
	},

	render: function(view, layout, data){
		view = Object.clone(this.cache['/views/' + view]);
		view.body = this.engines[this.engine](view.body, data);

		if (this.request.isAjax() || !layout) {
			this.serve(view);
		} else {
			data.view = view.body;
			layout = Object.clone(this.cache['/views/' + layout]);
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