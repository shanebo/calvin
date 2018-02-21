const traversy = require('traversy');
const callsites = require('callsites');
const { getCallsite, camelCase } = require('./utils');
const clone = require('clone');

const Components = function(dir) {
  this.stack = this.register(dir);
}

Components.prototype = {

  register(dir) {
    let map = {};

    traversy(dir, 'component.js$', (path) => {
      let layer = map;
      const parts = path
        .replace(dir, '')
        .replace(/(\/apps|\/components|\/component.js)/gi, '')
        .split('/')
        .filter(part => part !== '')
        .map(part => camelCase(part));

      parts
        .forEach((name, p) => {
          if (p === parts.length - 1) {
            layer[name] = require(path);
          } else if (!layer[name]) {
            layer[name] = {};
          }

          layer = layer[name];
        });
    });

    return map;
  },

  wrap(res, locals) {
    const render = (path, data) => {
      const dir = getCallsite(callsites()[1]);
      return res.app.render(`${dir}/${path}`, data);
    }

    const walk = (obj) => {
      for (var k in obj) {
        const layer = obj[k];
        if (typeof layer === 'object') {
          walk(layer);
        } else {
          obj[k] = (data = {}) => {
            data.locals = locals;
            return layer(render, data, res.request);
          }
        }
      }
    }

    const comps = clone(this.stack);
    walk(comps);
    return comps;
  }
};

module.exports = (dir) => new Components(dir);
