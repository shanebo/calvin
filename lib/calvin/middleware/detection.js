

var Detection = function(){
	console.log('--> Initializing Detection middleware...');
};


Detection.prototype = {

	platform: function(ua){
		if (/iphone|ipod|blackberry|(^(?=.*android)(?=.*mobile).*)|palm|windows ce/i.test(ua)) return 'mobile';
		if (/ipad|android/i.test(ua)) return 'tablet';
//		if (/windows|linux|os [x9]|solaris|bsd|spider|crawl|slurp|bot/i.test(ua)) return 'desktop';
		return 'desktop';
	},

	device: function(ua){
		if (/iphone/i.test(ua)) 	return 'iphone';
		if (/ipad/i.test(ua)) 		return 'ipad';
		if (/ipod/i.test(ua)) 		return 'ipod';
		if (/android/i.test(ua)) 	return 'android';
		return 'unknown';
	},

	isModern: function(ua){
		return ! /Firefox\/[1-3]{1}\.|MSIE [1-8]{1}\.|Chrome\/[1-6]{1}\.|Version\/[0-3]{1}\.[0-9]+(\.[0-9])? Safari/i.test(ua);
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
			platform:	this.platform(ua),
			device:		this.device(ua),
			density:	this.density(ua)
		}

		if (next) next();
	}

};


module.exports = Detection;