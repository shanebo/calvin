

var Detection = new Class({

	initialize: function(){
		console.log('--> Initializing Detection middleware...');

		this.mobile = new RegExp('(ipad|iphone|ipod|blackberry|android|palm|windows ce)', 'i');
		this.desktop = new RegExp('(windows|linux|os [x9]|solaris|bsd)', 'i');
		this.bot = new RegExp('(spider|crawl|slurp|bot)', 'i');
	},

	isDesktop: function(ua){
		return !this.mobile.test(ua) && (this.desktop.test(ua) || this.bot.test(ua));
	},

	isModern: function(ua){
		return ! new RegExp('Firefox/[0-3]|MSIE [0-8]|Chrome/[0-6]|Version/[0-3].[0-9](.[0-9])? Safari', 'i').test(ua);
//		(Firefox\/[0-3]\.)|(MSIE\s[0-8]\.)|(Chrome\/[0-6]\.)|(Version\/[0-3]\.[0-9]{1,2}(\.[0-9]{1,2})?\sSafari)
	},
	
	platform: function(ua){
		if (/(ipad|android)/i.test(ua)) return 'tablet';
		return 'mobile';
	},

	device: function(ua){
		if (/iphone/i.test(ua)) 	return 'iphone';
		if (/ipad/i.test(ua)) 		return 'ipad';
		if (/ipod/i.test(ua)) 		return 'ipod';
		if (/android/i.test(ua)) 	return 'android';
		return 'unknown';
	},

	density: function(ua){
		if (/iphone os 4/i.test(ua)) return 'retina';
		return 'standard';
	},

	handler: function(request, response, next){
		if (request.session && request.session.detection) return next();

		var ua = request.headers['user-agent'];
		
		request.session = request.session || {};

		request.detection = request.session.detection = {
			modern:		this.isModern(ua),
			platform:	this.isDesktop(ua) ? 'desktop' : this.platform(ua),
			device:		this.device(ua),
			density:	this.density(ua),
			dimensions:	'unknown'
		}

		if (next) next();
	}

});


module.exports = Detection;

