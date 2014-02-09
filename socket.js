var app = require('express')()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

server.listen(8888);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/realtime.html');
});

io.set('log level', 1); // reduce logging
io.sockets.on('connection', function (socket) {
  socket.emit('news', {'no': 0});
  socket.on('reply', function (data) {
    setTimeout(function() {
    	socket.emit('news', {'no': data.no + 1});
    }, 10);
  });
});