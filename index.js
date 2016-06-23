var Promise = require('bluebird');
var rp = require('request-promise');
var _ = require('underscore');
var Loki = require('lokijs');
var moment = require('moment');
var parseString = Promise.promisify(require('xml2js').parseString);
var cheerio = require('cheerio');

var Tram = function(options) {
  this.options = _.extendOwn({
    lang: 'en'
  }, options);

  this.cache = new Loki('cache.json');
};

Tram.WEST_DIRECTION = 'west';
Tram.EAST_DIRECTION = 'east';

/**
* Downloads Tram Stops from Server
*/
Tram.prototype.getTramStops = function() {
  var options = {
    method: 'GET',
    baseUrl: 'http://hktramways.com/js',
    uri: '/nextTramData.js'
  };

  return rp(options)
    .then(function(jsCode) {
      var evalTramStops = eval.call({},"'use strict';" + jsCode + '; var stops = {east: nextTramStopsE, west: nextTramStopsW}; stops');
      var tramStops = [];
      if (!evalTramStops.hasOwnProperty("west") || !evalTramStops.hasOwnProperty("east")) {
        throw Error("Invalid Server Data Error");
      }
      _.each(evalTramStops.east, function(tramStop) {
        tramStops.push({
          stop_code: tramStop[0],
          en_name: tramStop[1],
          tc_name: tramStop[2],
          sc_name: tramStop[3],
          direction: Tram.EAST_DIRECTION
        });
      });
      _.each(evalTramStops.west, function(tramStop) {
        tramStops.push({
          stop_code: tramStop[0],
          en_name: tramStop[1],
          tc_name: tramStop[2],
          sc_name: tramStop[3],
          direction: Tram.WEST_DIRECTION
        });
      });
      return tramStops;
    });
};

Tram.prototype.getNextTramETA = function(stopCode) {
  var options = {
    method: 'GET',
    baseUrl: 'http://hktramways.com',
    uri: '/nextTram/geteat.php?stop_code=' + stopCode
  };

  return rp(options)
    .then(function(xml) {
      return parseString(xml);
    }).then(function(result) {
      return _.map(result.root.metadata, function(item){
        var newItem = item.$;
        newItem.eta = newItem.eat;
        newItem.is_arrived = newItem.is_arrived === 1 ? true : false;
        newItem.is_last_tram = newItem.is_last_tram === 1 ? true : false;
        delete newItem.eat;
        return newItem;
      });
    });
};

Tram.prototype.getEmergencyTramMessage = function(stopCode) {
  var options = {
    method: 'GET',
    baseUrl: 'http://hktramways.com',
    uri: '/nextTram/getmessage.php?stop_code=' + stopCode
  };

  return rp(options)
    .then(function(xml) {
      return parseString(xml);
    }).then(function(result) {
      if (result.root === '') {
        return [];
      } else if (result.root.hasOwnProperty("metadata")) {
        return _.map(result.root.metadata, function(item){
          var newItem = item.$;
    //       { stop_code: 'WST',
    // special_msg_id: '574',
    // msg_tc: '緊急事故，服務暫停',
    // msg_en: 'Due to emergency, service suspended',
    // start_dt: 'Jun 20 2016  8:49PM',
    // end_dt: '',
    // update_dt: 'Jun 20 2016  8:49PM' }
          newItem.start_date = newItem.start_dt.length === 0 ? null : newItem.start_dt;
          newItem.end_date = newItem.end_dt.length === 0 ? null : newItem.end_dt;
          newItem.update_date = newItem.update_dt.length === 0 ? null : newItem.update_dt;
          delete newItem.start_dt;
          delete newItem.end_dt;
          delete newItem.update_dt;
          return newItem;
        });
      }
    });
};

Tram.prototype.getServiceUpdates = function() {
  var options = {
    method: 'GET',
    baseUrl: 'http://hktramways.com',
    uri: '/en/service-updates/'
  };

  return rp(options)
    .then(function(html) {
      return cheerio.load(html);
    }).then(function($) {
        var items = [];
        //console.log($('div#serviceUpdate table tr').children());
        $('div#serviceUpdate table').children('tr').each(function() {
          var item = {};
          item.id = $(this).attr('data-id');
          $(this).children('td').each(function(i, elem) {
            var td = $(this);
            if (td.hasClass('date')) {
              item.date = td.text().trim();
            } else if (td.hasClass('subject')) {
              item.subject = td.text().trim();
            } else if (td.attr('data-id')) {
              item.id = td.attr('data-id').trim();
            }
          });
          items.push(item);
        });
        return items;
    }).then(function(items) {
      return Promise.map(items, function(item) {
        var options = {
          method: 'GET',
          baseUrl: 'http://hktramways.com',
          uri: '/en/service-updates-detail/' + item.id + '/1'
        };

        return rp(options)
          .then(function(html) {
            return cheerio.load(html, {
              normalizeWhitespace: true,
              xmlMode: true
            });
          }).then(function($) {
            item.details_html = $('div#serviceUpdate dl dd div.desc').html().trim();
            // Promise.map awaits for returned promises as well.
            return item;
          });
      });
    });
};

Tram.prototype.getFares = function() {
  var options = {
    method: 'GET',
    baseUrl: 'http://hktramways.com',
    uri: '/en/schedules-fares/'
  };

  return rp(options)
    .then(function(html) {
      return cheerio.load(html, {
        normalizeWhitespace: true,
        xmlMode: true
      });
    }).then(function($) {
      var fares = [];
      $('div.fares table').children('tr').each(function() {
        var fare = {};
        $(this).children('td').each(function(i) {
          switch (i) {
            case 0:
              fare.type = $(this).text().trim();
              if (fare.type.substring(fare.type.length -1, fare.type.length) === '*')
                fare.type = fare.type.slice(0, fare.type.length - 1);
              break;
            case 1:
              fare.price = parseFloat($(this).text().trim().slice(1));
              break;
          }
        });
        fares.push(fare);
      });
      return fares;
    });
};

Tram.prototype.getSchedules = function() {
  var options = {
    method: 'GET',
    baseUrl: 'http://hktramways.com',
    uri: '/en/schedules-fares/'
  };

  return rp(options)
    .then(function(html) {
      return cheerio.load(html, {
        normalizeWhitespace: true,
        xmlMode: true
      });
    }).then(function($) {
      var fares = [];
      $('div.fares table').children('tr').each(function() {
        var fare = {};
        $(this).children('td').each(function(i) {
          switch (i) {
            case 0:
              fare.type = $(this).text().trim();
              if (fare.type.substring(fare.type.length -1, fare.type.length) === '*')
                fare.type = fare.type.slice(0, fare.type.length - 1);
              break;
            case 1:
              fare.price = parseFloat($(this).text().trim().slice(1));
              break;
          }
        });
        fares.push(fare);
      });
      return fares;
    });
};

module.exports = Tram;

var tram = new Tram();
/** Download a list of all tram stops**/
// tram.getTramStops().then(function(tramStops) {
//   console.log(tramStops);
// });

/** Get ETA for specific tram stop **/
tram.getNextTramETA('92W').then(function(data) {
  console.log(data);
});

/** Get Special Messages for specific tram stop **/
// tram.getEmergencyTramMessage('WST').then(function(data) {
//   console.log(data);
// });
// tram.getEmergencyTramMessage('92W').then(function(data) {
//   console.log(data);
// });

/** Get Special Messages for all Tram Stops **/
// tram.getTramStops().then(function(tramStops) {
//   _.each(tramStops, function(tramStop) {
//     tram.getNextTramMessage(tramStop.stop_code).then(function(data) {
//       if (data.length > 0) {
//         console.log(data);
//       }
//     });
//   });
// });

/** List all tram ETAs **/
// tram.getTramStops().then(function(tramStops) {
//   _.each(tramStops, function(tramStop) {
//     tram.getNextTramETA(tramStop.stop_code).then(function(eta) {
//       console.log(eta);
//     });
//   });
// });

/** Get Service Updates **/
// tram.getServiceUpdates().then(function(serviceUpdates) {
//   console.log(serviceUpdates);
// });

/** Get Fare Info **/
// tram.getFares().then(function(fares) {
//   console.log(fares);
// });

/** Get Schedule Info **/
// tram.getSchedules().then(function(schedules) {
//   console.log(schedules);
// });
