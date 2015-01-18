var app = require('express')(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    debug = require('debug')('http'),
    config = require('./config.json'),
    zmq = require('zmq'),
    zmqSock = zmq.socket('pull'),
    clients = [];

zmqSock.connect('tcp://' + config.zmq_server.host + ':' + config.zmq_server.port);

zmqSock.on('message', function(msg){
  debug('work:', msg.toString());
  for (var i = 0, len = clients.length; i < len; i++) {
    clients[i].emit('location', msg.toString());
  }
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/webroot/index.html');
});

io.on('connection', function(socket){
  clients.push(socket);
  socket.on('disconnect', function(){
    // delete the client
  });
});

http.listen(config.http_server.port, function(){
  debug('listening on *:' + config.http_server.port);
});