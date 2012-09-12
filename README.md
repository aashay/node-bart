#BART (Bay Area Rapid Transit) ETD (Estimated Time to Departure)

## TODO:  EVERYTHING

Pass in either a station code or a station code and a direction as an event!


Usage examples:
var bart = require('bart');

bart.on('dbrk south', function(info){
   console.log(info); 
});




To use your own key:

var bart = require('bart');