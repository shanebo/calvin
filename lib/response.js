

Error.stackTraceLimit = Infinity;
var Beard = require('beard');


var Response = {

    codes: [400, 401, 403, 404, 408, 500, 502, 503, 504],
    messages: {
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
        beard: {
            render: function(/*view, layout, data*/){
                var template, data;
                var args = arguments;

                if (args.length == 3) {
                    args[1] += "{{block view}}" + args[0] + "{{endblock}}";
                    template = args[1];
                    data = args[2];
                } else {
                    template = args[0];
                    data = args[1];
                }

                return Beard.render(template, data);
            }
        }
        // mustache: function(template, data){
        //     return Mustache.to_html(template, data);
        // }
    },

    error: function(err, status){
        status = this.codes.contains(status.toInt()) ? status.toInt() : 500;
        var message = this.messages[status];

        if (this.app.settings.environment === 'production') {
            this.app.settings.routes.get['/' + status].handlers[0](this.request, this, message);
        } else {
            this.writeHead(status, { 'Content-Type': 'text/html' });
            var trace = (err.stack || '').split('\n');
            var type = trace[0].replace(err.message, '').replace(':', '').clean();
            var stack = trace.slice(1).map(function(t){ return '<li>' + t.clean() + '</li>'; }).join('');

            this.end(this.partial('calvin/trace.html', {
                status: status,
                error: err,
                type: type,
                reason: err.message == status.toString() ? this.messages[status] : err.message,
                stack: stack
            }));
        }
    },

    serve: function(asset){
        var etag = this.request.headers['if-none-match'];

        if (etag && etag == asset.headers['ETag']) {
            this.writeHead(304, asset.headers);
            this.end();
            return;
        }

        asset.headers['Date'] = new Date().toUTCString();

        if (asset.headers['Content-Type'] == 'text/html') {
            asset.headers['Content-Length'] = Buffer.byteLength(asset.body, 'utf8');
            asset.headers['Vary'] = 'Accept-Encoding';
        }

        this.result = asset;
        this.writeHead(200, asset.headers);
        this.end(asset.body);
    },

    partial: function(view, data){
        // view = Object.clone(this.app.cache['/views/' + view]);
        return this.engines[this.app.settings.views.engine].render(this.app.cache['/views/' + view].body, data);
    },

    render: function(/*view, layout, data*/){
        var args = arguments;
        var engine = this.engines[this.app.settings.views.engine];

        if (arguments.length == 3) {
            var data = args[2];
            data.include = function(path){
                return this.partial(path, data);
            }.bind(this);

            var viewBody = engine.render(this.app.cache['/views/' + args[0]].body, data);
            var layout = Object.clone(this.app.cache['/views/' + args[1]]);
            layout.body = engine.render(viewBody, layout.body, data);
            this.serve(layout);
        } else {
            var data = args[1];
            var view = Object.clone(this.app.cache['/views/' + args[0]]);
            view.body = engine.render(view.body, data);
            this.serve(view);
        }
    },

    send: function(arg){
        var status, type, body;
        var args = arguments;

        if (args.length == 2) {
            body = args[0];
            status = args[1];
        } else if (typeof arg == 'number') {
            if (this.codes.contains(arg)) {
                this.error(new Error(arg), arg);
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
            body = this.app.settings.environment === 'development' ? JSON.stringify(body, null, 4) : JSON.stringify(body);
            type = 'application/json';
        } else {
            this.statusCode = status;
            this.end(body);
            return;
        }

        this.writeHead(status || 200, { 'Content-Type': type });
        this.end(body);
    },

    json: function(/* body, statusCode */){
        var args = arguments;

        if (args.length == 2) {
            var body = args[0];
            var status = args[1];
        } else {
            var body = args[0];
        }

        if (typeof body == 'object') {
            body = this.app.settings.environment === 'development' ? JSON.stringify(body, null, 4) : JSON.stringify(body);
        }

        this.writeHead(status || 200, { 'Content-Type': 'application/json' });
        this.end(body);
    },

    redirect: function(url, status){
        this.writeHead(status || 302, { 'Location': url, 'Pragma': 'no-cache' });
        this.end();
    }
};


exports.extend = function(request, response, app){
    for (var prop in Response) {
        response[prop] = Response[prop];
    }
    response.request = request;
    response.app = app;
    response.on('error', response.error);
};
