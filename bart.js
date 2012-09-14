var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var request = require('request');
var events = require('events');

var codes = require('./lib/codes');


//TODO: Redis is only a stopgap for test data
var redis = require('redis');
var rc = redis.createClient();

var ETDAPIURL_PREFIX = "http://api.bart.gov/api/etd.aspx?cmd=etd&orig=";
function Bart(){

    /**
     * Convenience function to smash two objects together.
     * @param obj1
     * @param obj2
     * @returns obj3, a merged object
     */
    function merge_objects(obj1,obj2){
        var obj3 = {};
        for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
        for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
        return obj3;
    }

    var apiKey = this.apiKey = "MW9S-E7SL-26DU-VV8V";
    var emitter = this.emitter = new events.EventEmitter();

    function Poller(station){
        this.interval = 60000;
        this.station = station.toLowerCase();
    }

    //TODO: Blow this away eventually
    Poller.prototype.testpoll = function(url){
        var self = this;
        //Simulate poll and change
        var tick = 0;
        var pollInterval = setInterval(function(){

        },self.interval);

        rc.get("bart:dbrk:1347519094049", function(err,data){
            self.handleData(err,JSON.parse(data));
        });
    }

    Poller.prototype.poll = function(url){
        var self = this;
        self._getData(url);
        this.pollInterval = setInterval(function(){
            self._getData(url);
        }, self.interval);
    }

    Poller.prototype._getData = function(url){
        var self = this;
        request.get(url, function (err, res, data) {
            if(err) return emitter.emitter('error', err);
            parser.parseString(data, function (err, result) {
                //rc.set("bart:"+self.station+":"+Date.now(), JSON.stringify(data));
                self.handleData(null,result);
            });
        });
    }

    Poller.prototype.handleData = function(err,data){
        var self = this;
        if(err) return emitter.emit('error', err);
        if(!data) return emitter.emit('error', "Could not get BART data");

        //In case of invalid API keys etc
        if(data.root.message && data.root.message[0].error){
            clearInterval(self.pollInterval);
            emitter.emit('error',data.root.message[0].error[0]);
            return;
        }
        //console.log(util.inspect(data, false, null))
        var etd = data.root.station[0].etd;
        var rootData = {
            "uri" : data.root.uri[0],
            "date" : data.root.date[0],
            "time" : data.root.time[0],
            "name" : data.root.station[0].name[0],
            "message" : data.root.message[0]
         }

        //BART has either stopped running for the night or they just don't have ETD for some reason.
        if(!etd){
            self.interval = self.interval * 2; //Back off
            return emitter.emit('error', "No current ETD info available for " + self.station);
        }

        //Synchronously split up northbound and southbound data
        var northBound = [];
        var southBound = [];
        //var station = data.root.station[0].abbr[0].toLowerCase();
        etd.forEach(function(e){            
            e.estimate.forEach(function(est){

                //Deal with the xml2js madness with a whole lotta [0]'s
                var destination = e.destination[0];
                var abbreviation = e.abbreviation[0];

                //The BART API is kinda silly in that it has the word "Leaving" when minutes hits 0.
                //"Leaving" isn't a number, so we make it 0.
                var minutes = (est.minutes[0]=="Leaving") ? 0 : parseInt(est.minutes[0]);
                var platform = est.platform[0];
                var direction = est.direction[0];
                var length = est.length[0];
                var color = est.color[0];
                var hexcolor = est.hexcolor[0];
                var bikeflag = !!est.bikeflag[0]; //A real bool!

                var info = merge_objects({
                    "station":self.station,
                    "destination":destination,
                    "abbreviation":abbreviation,
                    "minutes":minutes,
                    "platform":platform,
                    "direction": direction,
                    "length":length,
                    "color":color,
                    "hexcolor":hexcolor,
                    "bikeflag":bikeflag
                }, rootData);
                
                if(direction.toLowerCase() == "north"){
                    northBound.push(info);
                }else{
                    southBound.push(info);
                }
            }); 
        });
        if(northBound.length > 0){
            emitter.emit(self.station+" north", northBound); //Northbound event
        }
        if(southBound.length > 0){
            emitter.emit(self.station+" south", southBound); //Southbound events
        }
        
        emitter.emit(self.station, northBound.concat(southBound)); //Generic station event

        northBound = [];
        southBound = [];
    }


    var pollers = {}
    var bart = this;
    this.emitter.on('newListener', function(eventName, listener){
       if(eventName != "error"){
           station = eventName.split(' ')[0].toLowerCase();

           if(codes.indexOf(station) == -1){
               return bart.emitter.emit('error', station + " is not a valid BART station code.");
           }

           //Create a "poller" for this particular station, but if we don't have one already
           if(!pollers[station]){
               var poller = pollers[station] = new Poller(station);
               poller.interval = (bart.interval || poller.interval);
               var url = ETDAPIURL_PREFIX+station.toUpperCase()+"&key="+bart.apiKey;
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

Bart.prototype.setInterval = function(seconds){
    this.interval = seconds*1000;
}


module.exports = new Bart();

