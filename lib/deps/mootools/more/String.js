/*
---

script: String.Inflections.js

name: String Inflections

description: Several methods to convert strings back and forth between "railsish" names.  Helpful when creating JavaScript heavy rails (or similar MVC) apps.

license: MIT-style license.

authors:
  - Ryan Florence

thanks:
  - Rails Inflector (http://api.rubyonrails.org/classes/ActiveSupport/Inflector.html)
  - sporkyy (http://snippets.dzone.com/posts/show/3205)

requires: 
  - Core:1.2.4/String
  - Core:1.2.4/Number

provides: 
  - String.camelize
  - String.classify
  - String.dasherize
  - String.foreign_key
  - String.humanize
  - String.ordinalize
  - String.parameterize
  - String.pluralize
  - String.singularize
  - String.tableize
  - String.titleize
  - String.transliterate
  - String.underscore
  - String.capitalizeFirst
  - String.lowercaseFirst
  - Number.ordinalize

...
*/

(function(){

var plurals = [
	[/$/, 's'],
	[/s$/i, 's'],
	[/(ax|test)is$/i, '$1es'],
	[/(octop|vir)us$/i, '$1i'],
	[/(alias|status)$/i, '$1es'],
	[/(bu)s$/i, '$1ses'],
	[/(buffal|tomat)o$/i, '$1oes'],
	[/([ti])um$/i, '$1a'],
	[/sis$/i, 'ses'],
	[/(?:([^f])fe|([lr])f)$/i, '$1$2ves'],
	[/(hive)$/i, '$1s'],
	[/([^aeiouy]|qu)y$/i,	'$1ies'],
	[/(x|ch|ss|sh)$/i, '$1es'],
	[/(matr|vert|ind)ix|ex$/i, '$1ices'],
	[/([m|l])ouse$/i, '$1ice'],
	[/^(ox)$/i, '$1en'],
	[/(quiz)$/i, '$1zes']
];

var singulars = [
	[/s$/i, ''],
	[/(n)ews$/i, '$1ews'],
	[/([ti])a$/i, '$1um'],
	[/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$/i, '$1$2sis'],
	[/(^analy)ses$/i, '$1sis'],
	[/([^f])ves$/i, '$1fe'],
	[/(hive)s$/i, '$1'],
	[/(tive)s$/i, '$1'],
	[/([lr])ves$/i, '$1f'],
	[/([^aeiouy]|qu)ies$/i, '$1y'],
	[/(s)eries$/i, '$1eries'],
	[/(m)ovies$/i, '$1ovie'],
	[/(x|ch|ss|sh)es$/i, '$1'],
	[/([m|l])ice$/i, '$1ouse'],
	[/(bus)es$/i, '$1'],
	[/(o)es$/i, '$1'],
	[/(shoe)s$/i, '$1'],
	[/(cris|ax|test)es$/i, '$1is'],
	[/([octop|vir])i$/i, '$1us'],
	[/(alias|status)es$/i, '$1'],
	[/^(ox)en/i, '$1'],
	[/(vert|ind)ices$/i, '$1ex'],
	[/(matr)ices$/i, '$1ix'],
	[/(quiz)zes$/i, '$1']
];

var irregulars = [
	['category',	'categories'],
	['quiz',		'quizes'],
	['microwave',	'microwaves'],
	['cookie',		'cookies'],
	['move',		'moves'],
	['sex',			'sexes'],
	['foot', 		'feet'],
	['database',	'databases'],
	['accessory',	'accessories'],
	['cow',			'kine'],
	['move',		'moves'],
	['sex',			'sexes'],
	['child',		'children'],
	['man',			'men'],
	['person',		'people']
];

var uncountables = [
    'aircraft',
    'cannon',
    'deer',
    'money',
    'moose',
    'series',
    'sheep',
    'species',
    'swine',
	'equipment',
	'fish',
	'information',
	'jeans',
	'money',
	'rice',
	'series',
	'sheep',
	'species'
];	
	
String.implement({
	
	camelize: function(lower){
		var str = this.replace(/_\D/g, function(match){
			return match.charAt(1).toUpperCase();
		});
		return (lower) ? str : str.capitalize();
	},
	
	classify: function(){
		return this.singularize().camelize();
	},
	
	dasherize: function(){
		return this.replace('_', '-').replace(/ +/, '-');
	},
	
	foreign_key: function(dontUnderScoreId){
		return this.underscore() + (dontUnderScoreId ? 'id' : '_id');
	},

	humanize: function(){
		return this.replace(/_id$/, '').replace(/_/gi,' ').capitalizeFirst();
	},
	
	ordinalize: function() {
		var parsed = parseInt(this);
		if (11 <= parsed % 100 && parsed % 100 <= 13) {
			return this + "th";
		} else {
			switch (parsed % 10) {
				case  1: return this + "st";
				case  2: return this + "nd";
				case  3: return this + "rd";
				default: return this + "th";
			}
		}
	},
	
	pluralize: function(count) {
		if (count && parseInt(count) == 1) return this;
		for (var i = 0; i < uncountables.length; i++) {
			var uncountable = uncountables[i];
			if (this.toLowerCase() == uncountable) {
				return uncountable;
			}
		}
		for (var i = 0; i < irregulars.length; i++) {
			var singular = irregulars[i][0];
			var plural   = irregulars[i][1];
			if ((this.toLowerCase() == singular) || (this == plural)) {
				return plural;
			}
		}
		for (var i = 0; i < plurals.length; i++) {
			var regex          = plurals[i][0];
			var replace_string = plurals[i][1];
			if (regex.test(this)) {
				return this.replace(regex, replace_string);
			}
		}
	},
	
	singularize: function() {
		for (var i = 0; i < uncountables.length; i++) {
			var uncountable = uncountables[i];
			if (this.toLowerCase() == uncountable) {
				return uncountable;
			}
		}
		for (var i = 0; i < irregulars.length; i++) {
			var singular = irregulars[i][0];
			var plural   = irregulars[i][1];
			if ((this.toLowerCase() == singular) || (this == plural)) {
				return singular;
			}
		}
		for (var i = 0; i < singulars.length; i++) {
			var regex          = singulars[i][0];
			var replace_string = singulars[i][1];
			if (regex.test(this)) {
				return this.replace(regex, replace_string);
			}
		}
		return this;
	},
	
	tableize: function(){
		return this.underscore().pluralize();
	},
	
	titleize: function(){
		return this.underscore().humanize().capitalize();
	},
	
	underscore: function(){
		return this.lowercaseFirst().replace('-', '_').replace(/[A-Z]/g, function(match){
			return ('_' + match.charAt(0).toLowerCase());
		});
	},
	
	capitalizeFirst: function(){
		return this.charAt(0).toUpperCase() + this.slice(1);
	},
	
	lowercaseFirst: function(){
		return this.charAt(0).toLowerCase() + this.slice(1);
	},

	slug: function() {
		return this.replace(/ /gi, '-').toLowerCase();
	},

	slugize: function() {
		return this.replace(/ /gi, '-').toLowerCase();
	},

	dehyphenate: function() {
		return this.replace(/-/gi, ' ');
	},

    isSingular: function() {
        return this.pluralize().singularize().toLowerCase() == this.toLowerCase();
    },
    
    isPlural: function(plural) {
        return this.singularize().pluralize().toLowerCase() == this.toLowerCase();
    }

});


Number.implement({
	ordinalize: function(){
		return this + ''.ordinalize();
	}
});





// Link urls
// Convert strings that have urls to add anchor tags with property options

// URL pattern from John Gruber
var pattern = (/\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/g);

String.implement({

	linkURLs: function(attribs) {
		attribs = attribs || {};
		var attributes = [];
		for (var name in attribs) attributes.push(name + '="' + attribs[name] + '"');
	
		return this.replace(pattern, function(match) {
			return ['<a href="', match, '" ', attributes.join(' '), '>', match, '</a>'].join('');
		});
	}

});

// Switching patterns
String.linkURLs.setPattern = function(regexp) {
	if (typeof regexp === 'string') regexp = new RegExp(regexp, 'g');
	pattern = regexp;
	return null;
};




})();







/*
---

script: String.Inflector.js

description: Extends the String native with inflector methods, like pluralize and singularize.

license: MIT-style license

authors: Stian Didriksen

requires:
- core:1.2.4/String
- core:1.2.4/$util
- core:1.2.4/Array

provides: [String.Inflector]

notice: This script were originally written in MooTools 1.11; so it's not 100%, but it'll get there :)

...
*/


/*
(function(){



String.Inflector = new Class({
    
    Implements: [Options],

    options: {
        plural: [
            [/move$/i,            'moves'],
            [/sex$/i,            'sexes'],
            [/child$/i,            'children'],
            [/man$/i,            'men'],
            [/foot$/i,            'feet'],
            [/person$/i,            'people'],
            [/taxon$/i,            'taxa'],
            [/(quiz)$/i,            '$1zes'],
            [/^(ox)$/i,            '$1en'],
            [/(m|l)ouse$/i,            '$1ice'],
            [/(matr|vert|ind|suff)ix|ex$/i,    '$1ices'],
            [/(x|ch|ss|sh)$/i,        '$1es'],
            [/([^aeiouy]|qu)y$/i,        '$1ies'],
            [/(?:([^f])fe|([lr])f)$/i,    '$1$2ves'],
            [/sis$/i,            'ses'],
            [/([ti]|addend)um$/i,        '$1a'],
                    [/(alumn|formul)a$/i,        '$1ae'],
            [/(buffal|tomat|her)o$/i,    '$1oes'],
            [/(bu)s$/i,            '$1ses'],
            [/(alias|status)$/i,        '$1es'],
            [/(octop|vir)us$/i,        '$1i'],
                   [/(gen)us$/i,            '$1era'],
            [/(ax|test)is$/i,        '$1es'],
            [/s$/i,                's'],
            [/$/,                's']
        ],
        singular: [
            [/microwaves$/i,             'microwave'],
            [/cookies$/i,             'cookie'],
            [/moves$/i,             'move'],
            [/sexes$/i,             'sex'],
            [/children$/i,             'child'],
            [/men$/i,             'man'],
            [/feet$/i,             'foot'],
            [/people$/i,             'person'],
            [/taxa$/i,             'taxon'],
            [/databases$/i,            'database'],
            [/(quiz)zes$/i,         '$1'],
            [/(matr|suff)ices$/i,         '$1ix'],
            [/(vert|ind)ices$/i,        '$1ex'],
            [/^(ox)en/i,             '$1'],
            [/(alias|status)es$/i,        '$1'],
            [/(tomato|hero|buffalo)es$/i,    '$1'],
            [/([octop|vir])i$/i,        '$1us'],
            [/(gen)era$/i,            '$1us'],
            [/(cris|ax|test)es$/i,        '$1is'],
            [/(shoe)s$/i,             '$1'],
            [/(o)es$/i,             '$1'],
            [/(bus)es$/i,             '$1'],
            [/([m|l])ice$/i,         '$1ouse'],
            [/(x|ch|ss|sh)es$/i,        '$1'],
            [/(m)ovies$/i,            '$1ovie'],
            [/(s)eries$/i,            '$1eries'],
            [/([^aeiouy]|qu)ies$/i,        '$1y'],
            [/([lr])ves$/i,            '$1f'],
            [/(tive)s$/i,            '$1'],
            [/(hive)s$/i,            '$1'],
            [/([^f])ves$/i,         '$1fe'],
            [/(^analy)ses$/i,         '$1sis'],
            [/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$/i, '$1\2sis'],
            [/([ti]|addend)a$/i,        '$1um'],
            [/(alumn|formul)ae$/i,        '$1a'],
            [/(n)ews$/i,             '$1ews'],
            [/(.*)s$/i,             '$1']
        ],
        countable: [
            'aircraft',
            'cannon',
            'deer',
            'equipment',
            'fish',
            'information',
            'money',
            'moose',
            'rice',
            'series',
            'sheep',
            'species',
            'swine'
        ]
    },
  
    initialize: function(options){
        this.setOptions(options);
    },
    
    pluralize: function(word) {
        var result = word;
        
        this.options.plural.some(function(plural){
            if (plural[0].test(word)) return result = word.replace(plural[0], plural[1]);
        });
        
        this.options.countable.some(function(countable){
          if (word == countable) return result = countable;
        });
        
        return result;
    },
    
    singularize: function(word) {
        var result = word;

        this.options.singular.some(function(singular){
            if (singular[0].test(word)) return result = word.replace(singular[0], singular[1]);
        });
        
        this.options.countable.some(function(countable){
          if (word == countable) return result = countable;
        });
        
        return result;
    },
    
    isSingular: function(singular) {
        return this.singularize(this.pluralize(singular)).toLowerCase() == singular.toLowerCase();
    },
    
    isPlural: function(plural) {
        return this.pluralize(this.singularize(plural)).toLowerCase() == plural.toLowerCase();
    }
});

String.implement({
    pluralize: function(options) {
        inflector = new String.Inflector(options);
        return inflector.pluralize(this);
    },
    
    singularize: function(options) {
        inflector = new String.Inflector(options);
        return inflector.singularize(this);
    },
    
    isSingular: function(options) {
        inflector = new String.Inflector(options);
        return inflector.isSingular(this);
    },

    dehyphenate: function() {
        return this.replace(/-/g, ' ');
    },
    
    isPlural: function(options) {
        inflector = new String.Inflector(options);
        return inflector.isPlural(this);
    }
});



})();

*/


