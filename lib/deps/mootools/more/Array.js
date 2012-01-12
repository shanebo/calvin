

(function() {

	var query = function(match, value) {
//			console.log('value: ' + JSON.stringify(value));
		var matches = match.match(/\$(.+?)\((.+?)\)/);

		if (matches) {
//				console.log(matches);
			matches.shift();
			var fn = matches[0];
			var val = matches[1];
//				console.log('fn: ' + fn + ' val: ' + val + ' value: ' + value);

			switch (fn) {
				case 'contains':
					if (!value.contains(val)) return false;
				default:
//						return false;
			}
		}

		return true;
	};


	var walk = function(matcher, obj) {

		for (var key in matcher) {

			if (!matcher.hasOwnProperty(key)) continue;

			var match = matcher[key];
			var value = obj[key];
			var type = typeOf(match);

			switch (type) {
				case 'object':
					if (!walk(match, value)) return false;

				case 'array':
					var len = match.length;
					while (len--) {
						if (!walk(match[len], value[len])) return false;
					}
					break;

				default:
					if (match.charAt(0) == '$' && typeof value == 'object' && value !== undefined) {
						if (!query(match, value)) return false;
					} else if (match !== value) {
						return false;
					}
			}
		}
		return true;
	};


	Array.implement({

		match: function(matcher) {
			for (var i = 0, len = this.length; i < len; i++) {
				var value = this[i];
				if (walk(matcher, value)) return value;
			}
			return null;
		},

		matchAll: function(matcher) {
			var arr = [];
			for (var i = 0, len = this.length; i < len; i++) {
				var value = this[i];
				if (walk(matcher, value)) arr.push(value);
			}
			return arr;
		}

	});


})();
