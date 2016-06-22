Hong Kong Tramways Unofficial API
=====================================

## What is this for?

Trams are a special and historic means of transport in Hong Kong. They are cheap, fun and generally reliable. However there isn't an easy way to access information about them until recently. Hong Kong Tramways have made public next tram, schedule and fare information available online. This is an easy module to get the data so you can automate things.

For example, you could have a display at home with real-time next tram info.


## Install

`npm install --save hongkong-trams`


## Usage

When creating the instance, you can pass some options, for now, only the language code is supported, possible values are 'en' English, 'tc' Traditional Chinese or 'sc' Simplified Chinese.

```javascript
var HongKongTrams = require('hongkong-trams');

var trams = HongKongTrams({lang: 'en'});

hkPollution.getNextTramETA().then(function(eta){
    console.log(eta);
});
```


## Supported Methods

* [`getForecast()`](https://github.com/hongkongkiwi/node-hongkong-pollution/blob/master/examples/getForecast.js)

## Example data

All methods return JSON, please see the examples linked above for more info on how to call each method.



## Other Handy Modules

* [hongkong-weather](https://www.github.com/hongkongkiwi/node-hongkong-weather) - For Hong Kong Weather Information.
* [hongkong-pollution](https://www.github.com/hongkongkiwi/node-hongkong-pollution) - For Hong Kong Pollution Information.


## Contributing

Feel free to submit any pull requests or add functionality, I'm usually pretty responsive.

If you like the module, please consider donating some bitcoin or litecoin.

__Bitcoin__

![LNzdZksXcCF6qXbuiQpHPQ7LUeHuWa8dDW](http://i.imgur.com/9rsCfv5.png?1)

__LiteCoin__

![LNzdZksXcCF6qXbuiQpHPQ7LUeHuWa8dDW](http://i.imgur.com/yF1RoHp.png?1)
