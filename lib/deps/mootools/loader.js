

						require('./mootools-core-1.4.2-server');
	var fs 			=	require('fs');
	var directory 	=	__dirname + '/more/';


	fs.readdirSync(directory).forEach(function(file) {
		if (file.charAt(0) == '.') return;
		require(directory + file);
	}.bind(this));