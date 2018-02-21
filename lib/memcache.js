const Memcache = function() {
  this.data = {};
  this.data.static = {};
  this.data.routes = {};
}

// make this awesome

Memcache.prototype = {

  in(table) {
    this.table = table;
    return this;
  },

  get(key) {
    return this.data[this.table][key];
  },

  set(key, value) {
    this.data[this.table][key] = value;
    return this;
  },

  delete(key) {
    delete this.data[this.table][key];
  }
};

module.exports = () => new Memcache();
