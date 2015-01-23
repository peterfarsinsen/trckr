var socket = io();
    marker = null;


var map = new L.Map('map'),
    osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
    osmLayer = new L.TileLayer(osmUrl, {minZoom: 8, maxZoom: 20, attribution: osmAttrib});

var ll = [57.04264, 9.91881];
map.setView(ll,12);
map.addLayer(osmLayer);



socket.on('location', function(data) {
  var res = JSON.parse(data);
  console.log('raw', data);
  console.log('data', res);

  if(marker === null) {
    marker = L.marker(ll)
      .addTo(map)
      .bindPopup();
  }

  marker.setLatLng([res.lat, res.lng])
    .getPopup()
    .setContent(
      'Lat: ' + res.lat
      + '<br>Lng: ' + res.lng
      + '<br>At: ' + res.year + '/' + res.date + '/' + res.month
      + ' ' + res.hours + ':' + res.minutes + ':' + res.seconds
    );
  marker.openPopup();
  map.setView([res.lat, res.lng]);
});

