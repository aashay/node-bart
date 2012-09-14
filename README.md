#BART (Bay Area Rapid Transit) ETD (Estimated Time to Departure)
Disclaimer: [insert disclaimer here about not being affiliated with BART ]

## TODO:  EVERYTHING

Pass in either a station code or a station code and a direction as an event!


## Usage examples:

    var bart = require('bart');

    bart.on('dbrk', function(estimates){
       console.log(estimates); 
    });


You can also filter data by specifying a direction: 

    bart.on('dbrk south', function(southbound){
       console.log(southbound); 
    });

Note that if you specify a station-specific handler without a direction, you'll get events for both directions.




To use your own key, call `bart.setApiKey` before attaching event handlers:

    var bart = require('bart');
    bart.setApiKey("yourkeyhere");
    bart.on('mont', function(){...});




Tests:
-Try invalid bart code
-Try event with three names
-Test that directionless station events return both station events
-Test invalid api key

TODO:

Document the objects that are returned