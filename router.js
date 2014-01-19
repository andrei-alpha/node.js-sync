var url = require('url');
var sys = require('sys');
var events = require('events');
var http = require('http');
var path = require('path');
var filesys = require('fs');
var request = require('request')
var express = require('express');

var nodes = [];
var emitters = [];
var nodesLock = false;

var app = express();
app.use(express.bodyParser());
app.use(express.static( __dirname + '\\static'));

function load_file(my_path, res) {
	var full_path = path.join(process.cwd(), my_path);
	filesys.exists(full_path,function(exists){
		if(!exists){
			res.end("Hello there!");
		}
		else {
			res.sendfile(full_path);
		}
	});
}

function get_data(id, uid) {
	request.get(nodes[id] + '/getColor',
    	function (error, res, body) {
    		if (!error && res.statusCode == 200) {
    			var packet = JSON.parse(body);
        		emitters[uid].emit("data", packet);
    		}
        	else {
        		nodesLock = true;
    			nodes[id] = nodes[ nodes.length - 1 ];
    			nodes.pop();
    			console.log( JSON.stringify(nodes) );
    			nodesLock = false;
        	}
    	}
	);
}


function timeoutRequest(uid) {
	emitters[uid].emit("data", {'color': 'white'});
	console.log('client', uid, 'is dead');
}

function timeoutUser(uid) {
	emitters[uid] = null;
}

app.get('/init', function(req, res) {
	var uid = emitters.length;
	emitters.push(new events.EventEmitter());
	res.end( JSON.stringify( {'uid': uid}) );
});
app.get('/data', function(req, res) {
	// TO DO: put some smart load balacing logic here
	var uid = req.query.uid;
	if (uid < 0 || uid >= emitters.length || emitters[uid] == null) {
		res.end( JSON.stringify({'color': 'white'}) );
		return;
	}

	var node = Math.round(Math.random() * (nodes.length - 1));
	packet = get_data(node, uid);
	
	clearTimeout(function() {
		timeoutRequest(uid);
	});
	//setTimeout(function() {
	//	timeoutRequest(uid);
	//}, 2000);
	clearTimeout(function() {
		timeoutUser(uid);
	});
	//setTimeout(function() {
	//	timeoutUser(uid);
	//}, 4000);
	var listner = emitters[uid].once("data", function(data) {
		res.end( JSON.stringify(data) );
	});

});
app.post('/newNode', function(req, res) {
	node = req.body.url;
	if (nodes.indexOf(node) != -1) {
		res.end('ok');
		return;
	}
	nodes.push(node);
	console.log( JSON.stringify(nodes) )
	res.end('ok')
});
app.get('/*', function(req, res) {
	load_file(req.path, res);
});
app.listen(8888);

console.log('Server running at http://127.0.0.1:8888/');