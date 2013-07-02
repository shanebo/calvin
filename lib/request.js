

var Request = {

	setFlash: function(message){
		this.session.flash = message;
	},

	flash: function(){
		var flash = this.session.flash;
		this.session.flash = '';
		return flash;
	},

	isAjax: function(){
		return this.headers.hasOwnProperty('x-requested-with') && this.headers['x-requested-with'].toLowerCase() === 'xmlhttprequest';
	}

};


module.exports = Request;