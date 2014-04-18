

var Detection = function(){
	console.log('Initializing Detection middleware...');
}


Detection.prototype = {

	platform: function(ua){
		if (/iphone|ipod|blackberry|(^(?=.*android)(?=.*mobile).*)|palm|windows ce/i.test(ua)) return 'mobile';
		if (/ipad|android/i.test(ua)) return 'tablet';
		return 'desktop';
	},

	browser: function(ua){
		if (/chrome/i.test(ua)) 	return 'chrome';
		if (/msie/i.test(ua)) 		return 'ie';
		if (/firefox/i.test(ua)) 	return 'firefox';
		if (/safari/i.test(ua)) 	return 'safari';
		if (/opera/i.test(ua)) 		return 'opera';
		return 'unknown';
	},

	device: function(ua){
		if (/iphone/i.test(ua)) 	return 'iphone';
		if (/ipad/i.test(ua)) 		return 'ipad';
		if (/ipod/i.test(ua)) 		return 'ipod';
		if (/android/i.test(ua)) 	return 'android';
		return 'unknown';
	},

	modern: function(ua){
		return ! /firefox\/[1-3]{1}\.|msie [1-8]{1}\.|chrome\/[1-6]{1}\.|version\/[0-3]{1}\.[0-9]+(\.[0-9])? safari/i.test(ua);
	},

	handler: function(request, response, next){
		if (request.session && request.session.detection) return next();

		var ua = request.headers['user-agent'];

		request.session = request.session || {};
		request.session.detection = {};

		['browser','modern','platform','device'].forEach(function(property){
			request.session.detection[property] = this[property](ua);
		}, this);

		if (next) next();
	}

};


module.exports = function(){
	return new Detection();
}