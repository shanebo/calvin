const http = require('http');
const mime = require('mime');
const { asset, merge, extendProto, getCallsite, production } = require('./utils');
const proto = http.ServerResponse.prototype;
const callsites = require('callsites');


const Response = {

  properties: {

    messages() {
      return http.STATUS_CODES;
    }
  },

  methods: {

    get(header) {
      return this.getHeader(header);
    },

    set(header, value) {
      this.setHeader(header, value);
      return this;
    },

    error(error, status) {
      Error.stackTraceLimit = Infinity;
      const message = this.messages[status];
      const errorHandle = this.app.opts.errorHandle;

      if (errorHandle && production) {
        errorHandle.call(errorHandle, this.request, this, error, status, message);
      } else if (production) {
        this.status(status).render('calvin/status', {
          status,
          message
        });
      } else {
        let trace = (error.stack || '').split('\n');
        let type = trace[0].replace(error.message, '').replace(':', '');
        let stack = trace.slice(1).map(t => `${t}\n`).join('');
        let reason = error.message === status.toString() ? message : error.message;
        let output = `${status}\n${type}\n\n${reason}\n${stack}\n`;
        this.status(status).type('text').send(output);
      }
    },

    status(code) {
      this.statusCode = code;
      return this;
    },

    sendStatus(code) {
      this.status(code);
      this.end(`${code} : ${this.messages[code]}`);
    },

    type(value) {
      this.set('Content-Type', mime.lookup(value));
      return this;
    },

    send(body) {
      const type = typeof body;
      if (type === 'object') {
        this.json(body);
      } else if (type === 'string') {
        if (!this.get('Content-Type')) this.type('html');
        this.end(body);
      } else {
        this.type('text').end(body.toString());
      }
    },

    json(body, replacer, spaces = 2) {
      if (typeof body === 'object') {
        body = JSON.stringify(body, replacer, production ? 0 : spaces);
      }
      this.type('json').end(body);
    },

    location(url) {
      this.set('Location', url).end();
    },

    redirect(url) {
      const code = this.statusCode;
      if (!(code === 301 || code === 302)) this.status(302);
      this.set('Location', url).end();
    },

    serve(type, body) {
      this.writeHead(200, asset(type, body));
      this.end(body);
    },

    render(path, data = {}) {
      const template = `${getCallsite(callsites()[1])}/${path}`;
      const locals = merge(this.locals, data);
      locals.components = this.app.components.wrap(this, locals);
      const body = this.app.render(template, locals);

      // this should be conditionally set depending on env and method type
      // if (production && this.request.method === 'GET') {
        this.result = {
          body,
          template,
          locals
        };
      // }

      this.serve('html', body);
    }
  }
};

extendProto(proto, Response);

module.exports = proto;
