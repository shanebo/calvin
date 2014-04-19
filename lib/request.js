

var Request = {

	isAjax: function(){
		return this.headers.hasOwnProperty('x-requested-with') && this.headers['x-requested-with'].toLowerCase() === 'xmlhttprequest';
	}

};


module.exports = Request;