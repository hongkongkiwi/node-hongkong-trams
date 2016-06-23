var HongKongTram = require('../index');
var tram = new HongKongTram();

/** Get Special Messages for specific tram stop **/
tram.getEmergencyTramMessage('WST').then(function(data) {
  console.log(data);
}).catch(function(err) {
  console.error(err);
});

/** Get Special Messages for all Tram Stops **/
tram.getTramStops().then(function(tramStops) {
  _.each(tramStops, function(tramStop) {
    tram.getNextTramMessage(tramStop.stop_code).then(function(data) {
      if (data.length > 0) {
        console.log(data);
      }
    }).catch(function(err) {
      console.error(err);
    });
  });
}).catch(function(err) {
  console.error(err);
});
