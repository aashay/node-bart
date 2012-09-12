var xml2js = require('xml2js');
var parser = new xml2js.Parser();

var rest = require('restler');
var events = require('events');

//TODO: Redis is only a stopgap for test data
var redis = require('redis');
var rc = redis.createClient();

var ETDAPIURL_PREFIX = "http://api.bart.gov/api/etd.aspx?cmd=etd&orig=";
function Bart(){

    //TODO: Options n stuff
    
    var apiKey = this.apiKey = "MW9S-E7SL-26DU-VV8V";
    var emitter = this.emitter = new events.EventEmitter();
    
    
    function Poller(station){
        this.interval = 3000;
        this.station = station.toLowerCase();
        this.timeCache = {};
    }

    //TODO: Blow this away eventually
    Poller.prototype.testpoll = function(){
        var self = this;
        //Simulate poll and change
        var tick = 0;
        var pollInterval = setInterval(function(){

            rc.get("bartdata"+tick, function(err,data){
                self.handleData(err,JSON.parse(data));
                //console.log("Tick:" + tick + ", Time cache: " + JSON.stringify(self.timeCache));
                tick +=1;
                if(tick>2){
                    tick = 0;
                }

            });
        },self.interval);    
    }

    
    Poller.prototype.poll = function(url){        
        var self = this;
        rest.get(url,{
            "parser": rest.parsers.xml,
        }).on('error', function(e) {
            emitter.emit('error',e);
        }).on('success', function(data){
            self.handleData(null,data);
        });
    }

    Poller.prototype.handleData = function(err,data){
        var self = this;
        if(err) return emitter.emit('error', err);
        
        //In case of invalid API keys and the sort
        if(data.root.message && data.root.message[0].error){
            return emitter.emit('error',data.root.message[0].error[0]);
        }
        
        etd = data.root.station[0].etd;
        
        //BART has either stopped running for the night or they just don't have ETD for some reason.
        if(!etd){
            self.interval = self.interval * 2; //Back off 
            return emitter.emit('error', "No current ETD info available for " + self.station);
        }
        
        //var station = data.root.station[0].abbr[0].toLowerCase();
        etd.forEach(function(e){

            e.estimate.forEach(function(est){

                //Deal with the xml2js madness
                var destination = e.abbreviation[0];

                var minutes = parseInt(est.minutes[0]);
                var platform = est.platform[0];
                var direction = est.direction[0];
                var length = est.length[0];
                var color = est.color[0];
                var hexcolor = est.hexcolor[0];
                var bikeflag = !!est.bikeflag[0]; //A real bool!

                var info = {
                    "station":self.station,
                    "destination":destination,
                    "minutes":minutes,
                    "platform":platform,
                    "direction": direction,
                    "length":length,
                    "color":color,
                    "hexcolor":hexcolor,
                    "bikeflag":bikeflag
                }

                var stationPlusDirection = [self.station, direction].join(' ').toLowerCase();
                //If there has been a change in the time for a particular direction, emit!
                if(self.timeCache[stationPlusDirection] != minutes){
                    emitter.emit(self.station, info, e); //Generic station event
                    emitter.emit(stationPlusDirection, info, e); //Station + direction event
                }
                self.timeCache[stationPlusDirection] = minutes; //Cache the minutes for later
            });
        });
    }
  
    
    var pollers = {}
    var self = this;
    this.emitter.on('newListener', function(eventName, listener){
       if(eventName != "error"){
           //console.log("LISTENING TO " + eventName);
           station = eventName.split(' ')[0].toLowerCase();
           //console.log(station);

           //TODO make sure station is a legit station code

           //Create a "poller" for this particular station, but if we don't have one already
           if(!pollers[station]){
               var poller = pollers[station] = new Poller(station);
               var url = ETDAPIURL_PREFIX+station.toUpperCase()+"&key="+self.apiKey;
               poller.poll(url);
           }
       }
    });
        
}

Bart.prototype.on = function(eventName, listener){
    this.emitter.on(eventName, listener);
}

Bart.prototype.setApiKey = function(key){    
    this.apiKey = key;
}


var bart = new Bart();
module.exports = bart;

