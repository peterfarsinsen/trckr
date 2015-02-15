var express = require('express');
var app = express();
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var net = require('net');
var debug = require('debug')('app');

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

  getLastPoint(function(point) {
    emitPoint(point);
  });

  socket.on('disconnect', function(){
    // delete the client
  });
});

var getLastPoint = function(cb) {
  app.locals.db.collection('points').find({command: "BR00"}).sort({timestamp: -1}).limit(1).toArray(function(err, result) {
    if (err) throw err;
    cb(result[0]);
  });
};

var emitPoint = function(point) {
  for (var i = 0, len = app.locals.clients.length; i < len; i++) {
    app.locals.clients[i].emit('location', JSON.stringify(point));
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
var convertLatLng = function(input) {
  var degreesLength = input.length === 10 ? 3 : 2,
      degrees = input.slice(0, degreesLength),
      minutes = input.slice(degreesLength, input.length);
  minutes = (Number(minutes)/60)*100;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  minutes = String(minutes).replace('.', '');

  return parseFloat(Number(degrees + '.' + minutes).toFixed(5));
}

var server = net.createServer(function (socket) {
  socket.on('data', function(data) {

    // Determin message type
    var msgType = null;

    // Trim leading and trailing parens
    data = data.slice(1,data.length-1);

    // Split string by ")(" (if messages are concatinated)
    var arr = data.toString().split(")(");

    // for each element run the following
    arr.forEach(function(data) {

      if(data.length === 34) {
        msgType = 'heartbeat';
      } else if (data.length === 78) {
        msgType = 'location';
      } else {
        // Unknown message type
        throw 'Unknown message type for message' + data.toString();
        return;
      }

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
        rec.imei          = data.substring(0, 12);
        rec.command       = data.substring(12, 16);
        rec.year          = data.substring(16, 18);
        rec.month         = data.substring(18, 20);
        rec.day           = data.substring(20, 22);
        rec.status        = data.substring(22, 23);
        rec.lat           = convertLatLng(data.substring(23, 32));
        rec.latIndicator  = data.substring(32, 33);
        rec.lng           = convertLatLng(data.substring(33, 43));
        rec.lngIndicator  = data.substring(43, 44);
        rec.speed         = data.substring(44, 49);
        rec.hour          = data.substring(49, 51);
        rec.minute        = data.substring(51, 53);
        rec.second        = data.substring(53, 55);
        rec.orientation   = data.substring(55, 61);
        rec.status        = data.substring(61, 69);
        rec.l             = data.substring(69, 70);
        rec.milage        = data.substring(70, 78);

        rec.timestamp     = new Date(Date.UTC(
          parseInt(rec.year, 10) + 2000, // Otherwise Data defaults to 19xx
          parseInt(rec.month) - 1, // Month is zero based, because Javascript
          parseInt(rec.day),
          parseInt(rec.hour),
          parseInt(rec.minute),
          parseInt(rec.second)
        ));

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
        rec.imei          = data.substring( 0, 12);
        rec.command       = data.substring(12, 16);
        rec.deviceId      = data.substring(16, 31);
        rec.body          = data.substring(31, 34);

        saveHeartbeat(rec);
      }
    });
    socket.end();
  });
});

server.listen(43510);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Mount folders with static assets to /static
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/static', express.static(path.join(__dirname, 'bower_components')));

// Define route(s)
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
