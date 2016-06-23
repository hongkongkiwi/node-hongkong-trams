var HongKongTram = require('../index');
var tram = new HongKongTram();

/** Download a list of all tram stops**/
tram.getTramStops().then(function(tramStops) {
  console.log(tramStops);
}).catch(function(err) {
  console.error(err);
});
