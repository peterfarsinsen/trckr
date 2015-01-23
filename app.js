var express = require('express');
var app = express();
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var net = require('net');

var routes = require('./routes/index');

var httpServer = require('http').Server(app);
var io = require('socket.io')(httpServer);
httpServer.listen(43000);

// Connect to mongo
app.locals.db = require('mongoskin').db('mongodb://localhost:27017/trckr');

// Connected clients
app.locals.clients = [];

// Store clients for later
io.on('connection', function(socket){
  app.locals.clients.push(socket);
  socket.on('disconnect', function(){
    // delete the client
  });
});

var emitPoint = function(point) {
  for (var i = 0, len = app.locals.clients.length; i < len; i++) {
    app.locals.clients[i].emit('location', msg.toString());
  }
};

var savePoint = function(point) {
  app.locals.db.collection('points').insert([point], function(err, result) {
    debug('save result', err, result);
  });
};

var saveHeartbeat = function(heartbeat) {
  app.locals.db.collection('heartbeats').insert([heartbeat], function(err, result) {
    debug('save result', err, result);
  });
};

// Look away
var convertLat = function(lat) {
  var deg = lat.slice(0, 2),
      minutes = lat.slice(2, lat.length);
  minutes = (Number(minutes)/60)*100;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  minutes = String(minutes).replace('.', '');

  return Number(deg + '.' + minutes).toFixed(5);
}

// Told you not to look
var convertLng = function(lng) {
  var deg = lng.slice(0, 3),
      part = lng.slice(3, lng.length);

  part = (Number(part)/60)*100;
  part = part < 10 ? '0' + part : part;
  part = String(part).replace('.', '');

  return Number(deg + '.' + part).toFixed(5);
}

var server = net.createServer(function (socket) {
  socket.on('data', function(data) {

    // Determin message type
    var msgType = null;

    if(data.length === 36) {
      msgType = 'heartbeat';
    } else if (data.length === 80) {
      msgType = 'location';
    } else {
      // Unknown message type
      return;
    }

    // Trim leading and trailing parens
    data = data.slice(1,data.length-1);

    if(msgType === 'location') {
      /**
       * Example record:
       * (027042854711BR00150117A5702.5470N00955.1263E000.61648574.770000000000L00000000)
       *
       * 027042854711     # imei                        12 chars
       * BR00             # command                      4 chars
       * 150117           # date yy/mm/dd                6 chars
       * A                # A=valid GPS data, V=invalid  1 char
       * 5702.5470        # lat                          9 chars
       * N                # lat indicator                1 char
       * 00955.1263       # long                        10 chars
       * E                # long indicator               1 char
       * 000.6            # speed, km/hour               5 chars
       * 164857           # time hh/mm/ss                6 chars
       * 4.7700           # orientation, deb             6 chars
       * 00000000         # status                       8 chars
       * L                # always L ?                   1 char
       * 00000000         # mean milage ?                8 chars
       */
      var rec = {};
      rec.imei          = data.toString('ascii',  0, 12);
      rec.command       = data.toString('ascii', 12, 16);
      rec.year          = data.toString('ascii', 16, 18);
      rec.month         = data.toString('ascii', 18, 20);
      rec.date          = data.toString('ascii', 20, 22);
      rec.status        = data.toString('ascii', 22, 23);
      rec.lat           = convertLat(data.toString('ascii', 23, 32));
      rec.latIndicator  = data.toString('ascii', 32, 33);
      rec.lng           = convertLng(data.toString('ascii', 33, 43));
      rec.lngIndicator  = data.toString('ascii', 43, 44);
      rec.speed         = data.toString('ascii', 44, 49);
      rec.hours         = data.toString('ascii', 49, 51);
      rec.minutes       = data.toString('ascii', 51, 53);
      rec.seconds       = data.toString('ascii', 53, 55);
      rec.orientation   = data.toString('ascii', 55, 61);
      rec.status        = data.toString('ascii', 61, 69);
      rec.l             = data.toString('ascii', 69, 70);
      rec.milage        = data.toString('ascii', 70, 78);

      savePoint(rec);
      emitPoint(rec);
    } else if (msgType === 'heartbeat') {
      /**
       * Example record: (027042854711BP00000027042854711HSO)
       *
       * 027042854711       # imei            12 chars
       * BP00               # record type      4 chars
       * 000027042854711    # device id       15 chars
       * HSO                # message body     3 chars
       */
      var rec = {};
      rec.imei          = data.toString('ascii',  0, 12);
      rec.command       = data.toString('ascii', 12, 16);
      rec.deviceId      = data.toString('ascii', 16, 31);
      rec.body          = data.toString('ascii', 31, 34);

      saveHeartbeat(rec);
    }
  });
});

server.listen(43510);

// app.locals.db.collection('points').findOne({}, function(err, result) {
//   if (err) throw err;
//   console.log(result);
// });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/static', express.static(path.join(__dirname, 'bower_components')));

// Temp / binding
app.get('/', function(req, res){
  res.sendFile(__dirname + '/views/index.html');
});

//app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
// if (app.get('env') === 'development') {
//     app.use(function(err, req, res, next) {
//         res.status(err.status || 500);
//         res.render('error', {
//             message: err.message,
//             error: err
//         });
//     });
// }

// production error handler
// no stacktraces leaked to user
// app.use(function(err, req, res, next) {
//     res.status(err.status || 500);
//     res.render('error', {
//         message: err.message,
//         error: {}
//     });
// });

module.exports = app;