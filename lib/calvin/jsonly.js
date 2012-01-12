

	var fs = require('fs');
	var open = require('open-uri');
//	require('./String.Inflector');

	
/*
	where({name: query.or(query.equals('Mark'), query.like(/mark/i))});

	db.in('posts').where('id', 45).order('create_date', 'asc').find(7);
	db.in('posts').where('id', 45).order('create_date', 'asc').limit(7).find(1);
	db.in('posts').findId(45);


var query = {};

query.or = function(){
  var args = Array.prototype.slice.call(arguments),
    len = args.length;
  return function(value){
    for (var i = 0; i < len; i++){
      var fn = args[i];
      if (typeof fn != 'function') continue;
      if (fn(value)) return true;
    }
    return false;
  };
};

query.and = function(){
  var args = Array.prototype.slice.call(arguments),
    len = args.length;
  return function(value){
    for (var i = 0; i < len; i++){
      var fn = args[i];
      if (typeof fn != 'function') continue;
      if (!fn(value)) return false;
    }
    return true;
  };
};

query.equals = function(expected){
  return function(value){
    return value == expected;
  };
};

*/
	

//	db.in('posts').where({tag_id: 45}).order('create_date', 'asc').find(7);

// API	
//	db.in('collection').find(terms).order('property', 'direction');

//	db.in('slots').find(45);
//	.order('property', 'direction');







	var JSONLY = new Class({
	
		Implements: Options,
	
		options: {
			uri: false,
			path: false,
			collections: []
		},

		collections: {},
		query: {},
	
		initialize: function(options, next) {
			this.setOptions(options);
			this.endpoint = (!this.options.path) ? this.options.uri : this.options.path;

			this.options.collections.forEach(function(collection) {
				this[collection] = {
					file: this.endpoint + collection + '.json',
					array: false,
					index: {},
					sort: {}
				};
				this.cache(collection);
			}.bind(this));

			if (!this.options.uri) {
				this.indexAll(true);
//			} else {
			}

//			if (next) this.next = next;
		},

		indexAll: function(populate) {
			this.options.collections.forEach(function(collection) {
				this.index(collection, populate);
			}.bind(this));
		},

		remote: function(uri, collection) {
			console.log('uri: ' + uri);
			console.log('in remote');

			if (collection == 'slots') uri = this.options.uri + '/schedule.json';

			open(uri, function(err, json) {
				if (err) {
//					throw err;
					console.log(JSON.stringify(err));
					return;
				}
//				console.log(json);
//				console.log(json[collection]);
				this[collection].array = json[collection];
				this.index(collection);
				if (collection == this.options.collections[this.options.collections.length-1]){
					console.log('last collection, index now!!!!!');
					this.indexAll(true);
//					this.next(this);
				}
			}.bind(this));
		},

		cache: function(collection) {
			var file = this[collection].file;

			if (this.options.uri) {
				this.remote(file, collection);
			} else {
				this.load(file, collection);

				fs.unwatchFile(file);
				fs.watchFile(file, function (curr, prev) {
					if (curr.mtime.getTime() - prev.mtime.getTime()) {
						this.load(file, collection);
					}
				}.bind(this));
			}
		},

		load: function(file, collection) {
			console.log('Loading ' + file + ' file');
			var array = fs.readFileSync(file, 'utf8');
				array = JSON.decode(array);
			this[collection].array = array[collection];
			this.index(collection);
		},

		index: function(collection, populate) {
			console.log('Indexing ' + collection + ' collection');

//			if (this.options.collections.contains('organizations')) console.log(this[collection]);

			this[collection].array.each(function(item, i) {
				this[collection].index[item.id] = populate ? this.populate(item) : item;
				this[collection].sort[item.id] = i;
			}.bind(this));
		},

		batch: function(collection) {
			var arr = this[collection].array;
			arr.each(function(item, index) {
				if (item.hasOwnProperty('category')) {
//					item.category_id = item.category;
					delete item.category;
				}

				if (item.hasOwnProperty('sub_id') && item.sub_id == 'delete') {
//					"sub":"delete"
//					if (item.sub !== 'delete') item.sub_id = item.sub;
					delete item.sub_id;
				}

				if (item.hasOwnProperty('brand')) {
//					item.brand_id = item.brand;
					delete item.brand;
				}
			});

			this.save(collection, console.log('done with batch'));
		},

		in: function(collection) {
			this.query = {};
			this.query.collection = collection;
			return this;
		},

		where: function(match) {
			this.query.where = match;
			return this;
		},

		order: function(key, direction) {
			this.query.order = { key: key, direction: direction || 'asc' };
			return this;
		},

		limit: function(arr, count) {
			return arr.slice(0, count.toInt());
		},

		getProperty: function(obj, keys) {
		    var prop = obj;
		    for (var i = 0; i < keys.length; i++) prop = prop[keys[i]];
		    return prop;
		},

		orderBy: function(arr, key, way) {
			var keys = key.split('.');
			
			arr.sort(function compare(a, b) {
				var a_prop = this.getProperty(a, keys);
				var b_prop = this.getProperty(b, keys);
			
				switch (way) {
					case 'dec':
						if (a_prop > b_prop) return -1;
						if (a_prop < b_prop) return 1;
						return 0;
					case 'asc':
					default:
						if (a_prop < b_prop) return -1;
						if (a_prop > b_prop) return 1;
						return 0;
				}
			}.bind(this));

			return arr;
		},

		getMatches: function(limit) {
			var terms = this.query.where || false;
			var collection = this[this.query.collection];
			if (!terms) 						return Array.clone(collection.array)
			else if (typeof terms == 'string')	return Object.clone(collection.index[terms])
			else if (limit === 1) 				return Object.clone(collection.array.match(terms))
			else 								return Array.clone(collection.array.matchAll(terms));
			return false;
		},

		findById: function(id) {
			return Object.clone(this[this.query.collection].index[id]);
		},

		find: function(limit) {
			var matches = this.getMatches(limit);
			var is_array = Array.isArray(matches);
			if (this.query.populate) {
				// loop through and create a new array from index thats loaded
				matches = is_array ? this.populateAll(matches) : this.populate(matches);
			}
			if (this.query.order) {
				matches = this.orderBy(matches, this.query.order.key, this.query.order.direction);
			}
			if (is_array && limit) matches = this.limit(matches, limit);
			
			return matches;
		},

		populate: function(item) {
			var obj = Object.clone(item);
		
			Object.each(obj, function(value, key){
				if (key.test(/_id/g)) {
					var new_key = key.replace('_id', '');
					var collection = new_key.pluralize();
					if (this[collection] == undefined) return;
					var nested_obj = this.in(collection).findById(value);
					obj[new_key] = this.populate(nested_obj);
				}
			}.bind(this));

			return obj;
		},

		populateAll: function(arr) {
			return arr.map(function(obj) {
				return this.populate(obj);
			}.bind(this));
		},

		uuid: function() {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    			return v.toString(16);
			});
		},

		create: function(obj, next) {
			var collection = this.query.collection;
			if (!obj.hasOwnProperty('id')) obj['id'] = this.uuid();

			for (var key in obj) {
				if (obj[key] == undefined) delete obj[key];
			}

			this[collection].array.unshift(obj);
			console.log('\nCreating --> ' + obj);
			if (next) this.save(collection, next);
			return obj;
		},
	
		update: function(id, obj, next) {
			var collection = this.query.collection;
			var position = this[collection].sort[id];
			var item = this[collection].array[position];

			for (var key in obj) {
				if (obj[key] == undefined) delete item[key]
				else item[key] = obj[key];
			}

			this[collection].array[position] = item;
			console.log('\nUpdating --> ' + item);
			this.save(collection, next);
		},
	
		destroy: function(id, next) {
			var collection = this.query.collection;
			var position = this[collection].sort[id];
			this[collection].array.splice(position, 1);
			console.log('Destroying --> ' + id);
			this.save(collection, next);
		},

		save: function(collection, next) {
			var content = {};
			content[collection] = this[collection].array;
			fs.writeFileSync(this[collection].file, JSON.encode(content), 'utf8');
			this.index(collection, true);
			if (next) next();
		}

	});
	
	
	module.exports = JSONLY;
	

