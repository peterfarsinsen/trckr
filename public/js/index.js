var socket = io();
    marker = null;

socket.on('location', function(data) {
  var res = JSON.parse(data);
  console.log('raw', data);
  console.log('data', res);
  marker.setLatLng([res.lat, res.lng])
    .getPopup()
    .setContent(
      'Lat: ' + res.lat
      + '<br>Lng: ' + res.lng
      + '<br>At: ' + res.year + '/' + res.date + '/' + res.month
      + ' ' + res.hours + ':' + res.minutes + ':' + res.seconds
    );
  marker.openPopup();
});

var map = new L.Map('map'),
    osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
    osmLayer = new L.TileLayer(osmUrl, {minZoom: 8, maxZoom: 20, attribution: osmAttrib});

map.setView(new L.LatLng(57.04264, 9.91881),9);
map.addLayer(osmLayer);

marker = L.marker([57.04264, 9.91881])
  .addTo(map)
  .bindPopup();
