
var bart = require('./bart');
//bart.setApiKey("foo");

// bart.on('dbrk', function(data){
//     console.log("DBRK: ", data);
//     console.log();
// });

bart.on('dbrk south', function(data){
    console.log("Dbrk Southbound: ", data);
    console.log();
});

bart.on('dbrk north', function(data){
    console.log("Northbound: ", data);
    console.log();
});

bart.on('error', function(err){
   console.error(err);
});