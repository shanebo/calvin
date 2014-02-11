

Error.stackTraceLimit = Infinity;
var Beard = require('beard');


var Response = {

	engine: 'beard',
	errorCodes: [400, 401, 403, 404, 408, 500, 502, 503, 504],
	errorMessages: {
		400: 'Bad Request',
		401: 'Unauthorized',
		403: 'Forbidden Access',
		404: 'Path Not Found',
		408: 'Request Timeout',
		500: 'Internal Server Error',
		502: 'Service Temporarily Overloaded',
		503: 'Service Unavailable',
		504: 'Gateway Timeout'
	},

	engines: {
		beard: function(template, data){
			return Beard.render(template, data);
		}
//		mustache: function(template, data){
//			return Mustache.to_html(template, data);
//		}
	},

	error: function(err, status){
		status = this.errorCodes.contains(status.toInt()) ? status.toInt() : 500;
		var message = this.errorMessages[status];

		if (this.app.environment === 'production') {
			this.app.routes.get['/' + status].fn(this.request, this, message);
		} else {
			this.writeHead(status, { 'Content-Type': 'text/html' });
			var trace = (err.stack || '').split('\n');
			var type = trace[0].replace(err.message, '').replace(':', '').clean();
			var stack = trace.slice(1).map(function(t){ return '<li>' + t.clean() + '</li>'; }).join('');

			this.end(this.partial('calvin/trace.html', { 
				status: status,
				error: err,
				type: type,
				reason: err.message == status.toString() ? this.errorMessages[status] : err.message,
				stack: stack			
			}));
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

	send: function(arg){
		var status, type, body;
		var args = arguments;

		if (args.length == 2) {
			body = args[0];
			status = args[1];
		} else if (typeof arg == 'number') {
			if (this.errorCodes.contains(arg)) {
				throw new Error(arg);
				return;
			} else {
				status = arg;
			}
		} else {
			body = args[0];
			status = 200;
		}

		var body_type = typeof body;

		if (body_type == 'string') {
			type = 'text/html';
		} else if (body_type == 'object') {
			body = JSON.stringify(body, null, 4);
			type = 'application/json';
		} else {
			this.statusCode = status;
			this.end(body);
			return;
		}

		this.writeHead(status || 200, { 'Content-Type': type });
		this.end(body);
	},

	json: function(arg){
		var args = arguments;

		if (args.length == 2) {
			var body = args[0];
			var status = args[1];
		} else {
			var body = args[0];
		}

		if (typeof body == 'object') {
			body = JSON.stringify(body, null, 4);
		}

		this.writeHead(status || 200, { 'Content-Type': 'application/json' });
		this.end(body);
	},

	redirect: function(url, status){
		this.writeHead(status || 302, { 'Location': url, 'Pragma': 'no-cache' });
		this.end();
	}

};


module.exports = Response;