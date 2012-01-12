

	require('mootools');


	var helpers = {
	
//		include: function() {
//			return function(text, render) {
//				return Mustache.to_html(this.cache['/views' + text], this);
//			}
//		},

		states: function() {
			return [{"abbr":"AL","name":"Alabama"},{"abbr":"AK","name":"Alaska"},{"abbr":"AZ","name":"Arizona"},{"abbr":"AR","name":"Arkansas"},{"abbr":"CA","name":"California"},{"abbr":"CO","name":"Colorado"},{"abbr":"CT","name":"Connecticut"},{"abbr":"DE","name":"Delaware"},{"abbr":"DC","name":"District of Columbia"},{"abbr":"FL","name":"Florida"},{"abbr":"GA","name":"Georgia"},{"abbr":"HI","name":"Hawaii"},{"abbr":"ID","name":"Idaho"},{"abbr":"IL","name":"Illinois"},{"abbr":"IN","name":"Indiana"},{"abbr":"IA","name":"Iowa"},{"abbr":"KS","name":"Kansas"},{"abbr":"KY","name":"Kentucky"},{"abbr":"LA","name":"Louisiana"},{"abbr":"ME","name":"Maine"},{"abbr":"MD","name":"Maryland"},{"abbr":"MA","name":"Massachusetts"},{"abbr":"MI","name":"Michigan"},{"abbr":"MN","name":"Minnesota"},{"abbr":"MO","name":"Missouri"},{"abbr":"MT","name":"Montana"},{"abbr":"NE","name":"Nebraska"},{"abbr":"NV","name":"Nevada"},{"abbr":"NH","name":"New Hampshire"},{"abbr":"NJ","name":"New Jersey"},{"abbr":"NM","name":"New Mexico"},{"abbr":"NY","name":"New York"},{"abbr":"NC","name":"North Carolina"},{"abbr":"ND","name":"North Dakota"},{"abbr":"OH","name":"Ohio"},{"abbr":"OK","name":"Oklahoma"},{"abbr":"OR","name":"Oregon"},{"abbr":"PA","name":"Pennsylvania"},{"abbr":"RI","name":"Rhode Island"},{"abbr":"SC","name":"South Carolina"},{"abbr":"SD","name":"South Dakota"},{"abbr":"TN","name":"Tennessee"},{"abbr":"TX","name":"Texas"},{"abbr":"UT","name":"Utah"},{"abbr":"VT","name":"Vermont"},{"abbr":"VA","name":"Virginia"},{"abbr":"WA","name":"Washington"},{"abbr":"WV","name":"West Virginia"},{"abbr":"WI","name":"Wisconsin"},{"abbr":"WY","name":"Wyoming"}];
		},

		hasImage: function() {
			return this.image == 'true' ? true : false;
		},

		hasSub: function() {
			return subLabel == '' ? true : false;
		},

		isOn: function() {
			return this.i == subLabel ? true : false
		},

		isChecked: function() {
			return function(text, render) {
				var text = render(text).split('|');
				return text[0] == text[1] ? 'checked=""' : '';
			}
		},

		isSelected: function() {
			return function(text, render) {
				var text = render(text).split('|');
				return text[0] == text[1] ? 'selected' : '';
			}
//				console.log(this);
//				return this.i == categoryLabel ? true : false;
		},

		isSelectedHasSubs: function() {
//				console.log(this);
			return this.i == categoryLabel && subs.length ? true : false;
		},

		uppercase: function() {
			return function(text, render) {
				return render(text).toUpperCase();
			}
		},

		slug: function() {
			return function(text, render) {
				return render(text).replace(/ /gi, '-').toLowerCase();
			}
		}
//		,

//		pluralize: function() {
//			return function(text, render) {
//				return render(text).pluralize();
//			}
//		}
	
	};
	
	
	module.exports = helpers;
	
	