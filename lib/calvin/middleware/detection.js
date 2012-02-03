

var Detection = new Class({

	initialize: function(){
		console.log('--> Initializing Detection middleware...');

		this.mobile 	= new RegExp('(ipad|iphone|ipod|blackberry|android|palm|windows ce)', 'i');
		this.desktop	= new RegExp('(windows|linux|os [x9]|solaris|bsd)', 'i');
		this.bot 		= new RegExp('(spider|crawl|slurp|bot)', 'i');
//		this.device 	= new RegExp('(ipad|iphone|ipod|android|palm)', 'i');


//if ($http_user_agent ~* "(acer\ s100|android|archos5|blackberry9500|blackberry9530|blackberry9550|blackberry\ 9800|cupcake|docomo\ ht\-03a|dream|htc\ hero|htc\ magic|htc_dream|htc_magic|incognito|ipad|iphone|ipod|kindle|lg\-gw620|liquid\ build|maemo|mot\-mb200|mot\-mb300|nexus\ one|nokia|opera\ mini|samsung\-s8000|series60.*webkit|series60/5\.0|sonyericssone10|sonyericssonu20|sonyericssonx10|t\-mobile\ mytouch\ 3g|t\-mobile\ opal|tattoo|webmate|webos)") {
//        set $mobile_request '1';
//    }


//		
//		^(Mozilla.*(Gecko|KHTML|MSIE|Presto|Trident)|Opera).*$
//		I've observed small number of false negatives which are mostly mobile browsers. The exceptions all match:
//		(BlackBerry|HTC|LG|MOT|Nokia|NOKIAN|PLAYSTATION|PSP|SAMSUNG|SonyEricsson)

	},

	isDesktop: function(ua){
		//  Anything that looks like a phone isn't a desktop.
		//  Anything that looks like a desktop probably is.
		//  Anything that looks like a bot should default to desktop.
		return !this.mobile.test(ua) && (this.desktop.test(ua) || this.bot.test(ua));
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
		var ua = request.headers['user-agent'];
		
		request.detection = {
			platform: this.isDesktop(ua) ? 'desktop' : this.platform(ua),
			device: this.device(ua),
			density: this.density(ua),
			dimensions: 'unknown'
		}

		if (next) next();

		console.log(request.detection);
	}

});


module.exports = Detection;

