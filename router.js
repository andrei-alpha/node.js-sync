var url = require('url');
var sys = require('sys');
var events = require('events');
var http = require('http');
var path = require('path');
var filesys = require('fs');
var request = require('request');
var express = require('express');

var nodes = [];
var emitters = [];
var userTimeouts = [], requestTimeouts = [], requestQueue = [];
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

function serve() {
	console.log(requestQueue);

	while (requestQueue.length) {		
		var nodeid = requestQueue[0][0];
		var uid = requestQueue[0][1];
		get_data(nodeid, uid);
		requestQueue.shift();
	}
}

function get_data(nodeid, uid, pos) {
	request.get(nodes[nodeid] + '/getColor',
    	function (error, res, body) {
    		if (!error && res.statusCode == 200) {
    			var packet = JSON.parse(body);
        		emitters[uid].emit("data", packet);
    		}
        	else {
        		nodesLock = true;
    			nodes[nodeid] = nodes[ nodes.length - 1 ];
    			nodes.pop();
    			nodesLock = false;
        	}
    	}
	);
}


function timeoutRequest(uid) {
	if (emitters[uid])
		emitters[uid].emit("data", {'color': 'white'});
}

function timeoutUser(uid) {
	emitters[uid] = null;
	console.log('#user ', uid, 'died')
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

	//console.log('got req from', uid);
	var node = Math.floor(Math.random() * nodes.length);
	requestQueue.push([node, uid]);
	
	//clearTimeout(requestTimeouts[uid]);
	//requestTimeouts[uid] = setTimeout(function() {
	//	timeoutRequest(uid);
	//}, 2000);
	//clearTimeout(userTimeouts[uid]);
	//userTimeouts[uid] = setTimeout(function() {
	//	timeoutUser(uid);
	//}, 5000);
	
	emitters[uid].once("data", function(data) {
		res.end( JSON.stringify(data) );
	});

});
app.post('/newNode', function(req, res) {
	node = req.body.url;
	if (nodes.indexOf(node) != -1) {
		res.status(304);
		res.end('ok');
		return;
	}
	nodes.push(node);
	console.log( JSON.stringify(nodes) )
	data = {'time': new Date().getTime()};
	res.end( JSON.stringify(data) );
});
app.get('/*', function(req, res) {
	load_file(req.path, res);
});
app.listen(8888);
setInterval(serve, 1000);

/*
io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});*/

console.log('Server running at http://127.0.0.1:8888/');