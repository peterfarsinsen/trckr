# Trckr is a GPS tracker thingie

Trckr is a TCP server that collects location data from one or more GPS trackers **and** a HTTP server that shows the collected location data real time on a map. Trckr is written in NodeJS and based primarly on Express.

## Built for GT02A or not
Trckr was built to be used with a cheap China tracker labled GT02A(HY). In fact it's not a GT02A, but it's protocol is somewhat similar to that of the TK103. The protocol isn't fully compatiable with the TK103 though.

If you know the protocol of your tracker it should be fairly easy to change Trckr to work with your device.

Pull requests are welcomed!

## Getting started
Run ```npm install``` to install Trckrs dependencies.

Run ```npm install -g bower``` to install Bower

Run ```bower install``` to install client side dependencies

Run ```node app.js``` to start Trckr. To debug the Trckr run ```DEBUG=* node app.js```.

By default the TCP server listens on port 43510 and HTTP server listens on port 43000. 

## Dependencies
Trckr expects you to run a MongoDB server on localhost:27017 

## License
Trackr is licensen under the MIT license. See the LICENSE file.

