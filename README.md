# Trckr is a GPS tracker thingie

Trckr is a TCP server that collects location data from one or more GPS trackers **and** a HTTP server that shows the collected location data real time on a map. Trckr is written in NodeJS.

## Built for GT02A or not
Trckr was built to be used with a cheap China tracker labled GT02A(HY). In fact it's not a GT02A, but it's protocol is somewhat similar to that of the TK103. The protocol isn't fully compatiable with the TK103 though.

If you know the protocol of your tracker it should be fairly easy to change Trckr to work with your device.

Pull requests are welcomed!

## Getting started
Run ```npm install``` to install Trckrs dependencies.

Run ```node tcp_server.js``` to start the TCP server, that collects location data from your GPS tracker device(s).

Run ```node http_server.js``` to start the HTTP server, that shows the location of your GPS tracker devices.

Take a look at config.json to see default ports.

## License
Trackr is licensen under the MIT license. See the LICENSE file.

