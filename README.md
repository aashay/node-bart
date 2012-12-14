#BART (Bay Area Rapid Transit) ETD (Estimated Time to Departure)
Disclaimer: [insert disclaimer here about not being affiliated with BART ]

Pass in either a station code or a station code and a direction as an event!

## Usage examples:

    var bart = require('bart').createClient();

    bart.on('dbrk', function(estimates){
       console.log(estimates); 
    });


The above example would output something like this:

    [ { station: 'dbrk',
        destination: 'Richmond',
        abbreviation: 'RICH',
        minutes: 5,
        platform: '1',
        direction: 'North',
        length: '9',
        color: 'RED',
        hexcolor: '#ff0000',
        bikeflag: true,
        uri: 'http://api.bart.gov/api/etd.aspx?cmd=etd&orig=DBRK',
        date: '12/10/2012',
        time: '08:52:38 PM PST',
        name: 'Downtown Berkeley',
        message: {} },
      { station: 'dbrk',
        destination: 'Richmond',
        abbreviation: 'RICH',
        minutes: 11,
        platform: '1',
        direction: 'North',
        length: '6',
        color: 'ORANGE',
        hexcolor: '#ff9933',
        bikeflag: true,
        uri: 'http://api.bart.gov/api/etd.aspx?cmd=etd&orig=DBRK',
        date: '12/10/2012',
        time: '08:52:38 PM PST',
        name: 'Downtown Berkeley',
        message: {} },
        ...
    ]


You can also filter data by specifying a direction: 

    bart.on('dbrk south', function(southbound){
       console.log(southbound); 
    });

Note that if you specify a station-specific handler without a direction, you'll get events for both directions.


## API

TODO:  For now, use the above usage examples because frankly, that's all this does.  But, if you need slightly different options:

### bart.createClient(options)
Create a bart client with options.  If no options are specified, defaults will be used.

* `apiKey`: Set your own API key if you have one here.  If none is provided, the common `MW9S-E7SL-26DU-VV8V` key will be used.
* `interval`: A default polling interval in milliseconds for each poller.  If not set, a value of 60 seconds (60000 milliseconds) will be used.  Note that the BART API is a public service and it's probably a really terrible idea to set this any lower.
    
    
Example:

    var bart = require('bart').createClient({"apiKey":"YOUR-API-KEY", "interval":90000});
    bart.on('mont', function(){...});




Tests:
-Try event with three names
-Test that directionless station events return both station events
-Test invalid api key

TODO:

Document the objects that are returned


## License

MIT.  

Also, I take no responsibility for any trains you may miss as a result of this module. :)

## Contributing

Pull requests are welcome.
