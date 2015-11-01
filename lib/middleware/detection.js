

var parser = require('ua-parser-js');


var Detection = function(){
	console.log('Initializing Detection middleware...');
}


Detection.prototype = {

	modern: function(ua){
		return ! /firefox\/[1-3]{1}\.|msie [1-8]{1}\.|chrome\/[1-6]{1}\.|version\/[0-3]{1}\.[0-9]+(\.[0-9])? safari/i.test(ua);
	},

	handler: function(request, response, next){
		if (request.session && request.session.detection) return next();

		var ua = request.headers['user-agent'];
		
		var parsed = parser(ua);

  		request.session.detection = {
			ua: parsed.ua,
			browser: {
				name: parsed.browser.name,
				version: parsed.browser.version,
				major: parsed.browser.major
			},
			engine: {
				version: parsed.engine.version,
				name: parsed.engine.name
			},
			os: {
				name: parsed.os.name,
				version: parsed.os.version
			},
			device: {
				model: parsed.device.model,
				vendor: parsed.device.vendor,
				type: parsed.device.type
			},
			cpu: {
				architecture: parsed.cpu.architecture
			}
		};

		request.session.detection.modern = this.modern(ua);

		next();
	}

};


module.exports = function(){
	return new Detection();
}
