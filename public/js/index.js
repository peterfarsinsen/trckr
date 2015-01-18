var socket = io();
    marker = null;

socket.on('location', function(data) {
  var res = JSON.parse(data);
  marker.setLatLng([res.lat, res.long])
    .getPopup()
    .setContent(
      'Lat: ' + res.lat
      + '<br>Lng: ' + res.long
      + '<br>At: ' + res.year + '/' + res.date + '/' + res.month
      + ' ' + res.hours + ':' + res.minutes + ':' + res.seconds
    );
  marker.openPopup();
});

var map = new L.Map('map'),
    osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
    osmLayer = new L.TileLayer(osmUrl, {minZoom: 8, maxZoom: 20, attribution: osmAttrib});

map.setView(new L.LatLng(57.04236, 9.55124),9);
map.addLayer(osmLayer);

marker = L.marker([57.04236, 9.55124])
  .addTo(map)
  .bindPopup();