var HongKongTram = require('../index');
var tram = new HongKongTram();

/** Get ETA for specific tram stop **/
tram.getNextTramETA('92W').then(function(data) {
  console.log(data);
}).catch(function(err) {
  console.error(err);
});

/** List all tram ETAs **/
tram.getTramStops().then(function(tramStops) {
  _.each(tramStops, function(tramStop) {
    tram.getNextTramETA(tramStop.stop_code).then(function(eta) {
      console.log(eta);
    }).catch(function(err) {
      console.error(err);
    });
  });
}).catch(function(err) {
  console.error(err);
});
