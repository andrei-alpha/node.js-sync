var url = require('url')
var sys = require('sys')
var events = require('events')
var http = require('http')
var path = require('path')
var filesys = require('fs')
var request = require('request')
var express = require('express')

var count = 0;
var color = "#";
var port = 8000 + Math.round(Math.random() * 1000);
var timestamp = "";

function newColor() {
    var date = new Date();
    //console.log('#newColor', date.getMilliseconds());
    
    color = '#';
    var letters = '0123456789ABCDEF'.split('');
    for (var i = 0; i < 6; ++i) {
        var code = Math.round(date.getSeconds() * i * Math.sin(date.getTime())) % 16;
        if (code < 0) code *= -1;
        color = color + letters[code];
    }
    console.log(color);

    timestamp = date.getHours() + ":" + date.getMinutes() + ":" 
    	+ date.getSeconds() + ":" + date.getMilliseconds();
   	var end = new Date().getMilliseconds();
    setTimeout(newColor, 1000 - end % 1000);
}

function send_data() {
	request.post(
    	'http://127.0.0.1:8888/newNode',
    	{ form: { 'url': 'http://localhost:' + port} },
    	function (error, res, body) {
        	if (!error && res.statusCode == 200) {
            	var packet = JSON.parse(body);
            	setTimeout(newColor, 2000 - packet.time % 2000 - 20);
        	}
        	else {
        		;//console.log(error);
        	}
    	}
	);
}

function load_file(my_path, res) {
	var full_path = path.join(process.cwd(), my_path);
	filesys.exists(full_path,function(exists){
		if(!exists){
			res.end("404 Not Found\n");
		}
		else {
			res.sendfile(full_path);
		}
	});
}

function stats() {
	console.log(count + ' requests in the last 10 sec');
	count = 0;
}

var app = express();
app.use(express.static( __dirname + '\\static'));
app.use(express.bodyParser());

app.get('/getColor', function(req, res) {
	count = count + 1;
	//console.log('#request', 'getColor', date.getSeconds() );

    var packet = {'likes': 'xxx', 'time': timestamp, 'color': color};
	res.end( JSON.stringify(packet) );
});
app.get('/*', function(req, res) {
	load_file(req.path, res);
});
app.listen(port)

send_data();
setInterval(send_data, 4000);
setInterval(stats, 20000);

console.log('Server running at http://127.0.0.1:' + port + '/');
