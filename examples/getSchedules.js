var HongKongTram = require('../index');
var tram = new HongKongTram();

/** Get Schedule Info **/
tram.getSchedules().then(function(schedules) {
  console.log(schedules);
}).catch(function(err) {
  console.error(err);
});
